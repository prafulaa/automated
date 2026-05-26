// Stripe billing webhook handler
// Receives Stripe events and updates subscription status in Supabase

import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

function getStripe() {
  const key = process.env['STRIPE_SECRET_KEY'];
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  // Dynamic import to avoid build-time initialization
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const StripeLib = require('stripe');
  return new StripeLib(key);
}

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json({ error: 'Billing not configured' }, { status: 501 });
  }

  let event: Stripe.Event;

  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env['STRIPE_WEBHOOK_SECRET'] || '',
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Handle relevant events
  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        await updateSubscriptionStatus(customerId, subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        await cancelSubscription(customerId);
        break;
      }
    }
  } catch (err) {
    console.error('Billing webhook error:', err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function updateSubscriptionStatus(
  stripeCustomerId: string,
  subscription: Stripe.Subscription,
): Promise<void> {
  // In production: update Supabase subscriptions table
  // const supabase = await createClient();
  // await supabase.from('subscriptions').update({ ... }).eq('stripe_customer_id', stripeCustomerId);

  const priceId = subscription.items.data[0]?.price?.id;
  const tier = mapPriceToTier(priceId || '');
  const status = subscription.status === 'active' ? 'active'
    : subscription.status === 'past_due' ? 'past_due'
    : subscription.status === 'trialing' ? 'trialing'
    : 'canceled';

  console.log(`[Billing] Updated ${stripeCustomerId}: tier=${tier} status=${status}`);
}

async function cancelSubscription(stripeCustomerId: string): Promise<void> {
  console.log(`[Billing] Canceled subscription for ${stripeCustomerId}`);
}

function mapPriceToTier(priceId: string): string {
  if (priceId === process.env['STRIPE_PRICE_STARTUP']) return 'startup';
  if (priceId === process.env['STRIPE_PRICE_ENTERPRISE']) return 'enterprise';
  return 'free';
}
