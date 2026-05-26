-- BlastRadius Database Schema
-- Run against your Supabase Postgres instance

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  github_username TEXT,
  github_id BIGINT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- GitHub App installations
CREATE TABLE IF NOT EXISTS public.installations (
  id SERIAL PRIMARY KEY,
  installation_id BIGINT UNIQUE NOT NULL,
  owner TEXT NOT NULL,
  owner_type TEXT CHECK (owner_type IN ('User', 'Organization')) NOT NULL DEFAULT 'User',
  repos TEXT[] DEFAULT '{}',
  installed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription tiers and status
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) UNIQUE NOT NULL,
  tier TEXT CHECK (tier IN ('free', 'startup', 'enterprise')) NOT NULL DEFAULT 'free',
  status TEXT CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')) NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analysis reports (for dashboard history)
CREATE TABLE IF NOT EXISTS public.reports (
  id SERIAL PRIMARY KEY,
  installation_id BIGINT REFERENCES public.installations(installation_id),
  repo_full_name TEXT NOT NULL,
  pr_number INTEGER NOT NULL,
  risk_level TEXT CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')) NOT NULL,
  total_impacted INTEGER NOT NULL DEFAULT 0,
  depth_max INTEGER NOT NULL DEFAULT 0,
  comment_id BIGINT,
  comment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_installations_owner ON public.installations(owner);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_installation ON public.reports(installation_id, created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/write their own
CREATE POLICY profiles_self ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Installations: authenticated users can read their own
CREATE POLICY installations_owner ON public.installations
  FOR SELECT USING (installed_by = auth.uid());

-- Subscriptions: users can read their own
CREATE POLICY subscriptions_self ON public.subscriptions
  FOR SELECT USING (user_id = auth.uid());

-- Reports: users can read reports for their installations
CREATE POLICY reports_owner ON public.reports
  FOR SELECT USING (
    installation_id IN (
      SELECT installation_id FROM public.installations WHERE installed_by = auth.uid()
    )
  );

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, github_username, github_id, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'user_name',
    (NEW.raw_user_meta_data->>'provider_id')::BIGINT,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
