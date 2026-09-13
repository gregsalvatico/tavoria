# Stripe implementation notes

This is the handoff checklist for enabling venue subscriptions. Do not enable
live billing until the business and accounting decisions below are confirmed.

## Product rules

- Venue Pro: `€19/month`.
- New venues: 30-day free trial, with no card required at signup.
- Free venue plan remains available indefinitely:
  - publish shifts;
  - receive up to 3 applications per month;
  - use the venue QR sticker.
- The first 100 Locali Fondatori are free forever.
- Once the first 100 founder slots are claimed, new venues must subscribe before
  completing venue signup.
- Until the server-side counter exists, local signup uses
  `EXPO_PUBLIC_FOUNDER_SLOTS_AVAILABLE=false` as the paywall switch. Do not
  treat this client-visible switch as production enforcement.
- Paid venues can pause for one or two months and cancel freely.
- Workers remain free.

## Decisions required before coding

- Confirm whether the public price is `€19 + IVA` or `€19 IVA inclusa`.
- Confirm the founder cohort is recorded as a permanent entitlement when each
  of the first 100 venue records is created. The current app switch is only a
  local/UI placeholder; production needs an atomic Supabase counter or RPC.
- Confirm whether regular venue trials can start immediately.
- Choose the Italian electronic-invoicing provider and confirm the SDI/PEC
  fields required at signup with the commercialista.
- Confirm the exact features gated behind Pro. The free plan must remain useful,
  while the paid limit should be enforced server-side.

## Recommended architecture

Use Stripe Billing on Tavoria's own Stripe account. Do not use Stripe Connect:
Connect belongs to marketplace payouts, while this product charges venues for
Tavoria itself.

The Expo app should call Supabase Edge Functions rather than Stripe directly:

1. `create-checkout-session` validates the authenticated venue owner and creates
   a Stripe Checkout subscription session.
2. Stripe redirects back to the app after success or cancellation.
3. `stripe-webhook` verifies the Stripe signature and synchronizes subscription
   state into Supabase. Webhook handling is authoritative; the client must not
   grant Pro access based only on a redirect.
4. `create-portal-session` creates a short-lived Customer Portal session for
   payment methods, invoices, cancellation and pause/resume management.
5. A later invoicing function sends the required paid-invoice data to the
   selected Italian SDI provider.

Do not put Stripe secret keys or the Supabase service-role key in the Expo app,
`EXPO_PUBLIC_*` variables, or the landing-page bundle.

## Secrets and Stripe configuration

Supabase Edge Function secrets:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID`
- `STRIPE_SUCCESS_URL`
- `STRIPE_CANCEL_URL`
- `SUPABASE_SERVICE_ROLE_KEY` only if the function needs privileged writes

Create the product and recurring EUR price in Stripe Dashboard. Store the Price
ID in a secret; never hardcode the amount as the billing source of truth.
Configure the Customer Portal with the Tavoria logo, cancellation, payment
method updates, invoice access, and the approved pause behavior.

## Supabase data model

Add venue billing fields through a Supabase migration, with RLS preventing users
from changing their own billing state:

- `stripe_customer_id`
- `stripe_subscription_id`
- `subscription_status`
- `trial_ends_at`
- `current_period_end`
- `cancel_at_period_end`
- `paused_until`
- `is_founder_venue`
- `founder_claimed_at`
- `billing_email`
- `billing_name`
- `billing_vat_number`
- `billing_sdi_code` or `billing_pec`

Keep the entitlement check in one server-side helper. A venue is Pro only when
its synchronized Stripe state is active or trialing. Founder venues are a
separate permanent free entitlement. The free plan must not depend on Stripe
availability.

## Webhook events

Handle and make idempotent at minimum:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.subscription.trial_will_end`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.paused`
- `customer.subscription.resumed`

Store processed Stripe event IDs so retries cannot duplicate state changes.
Verify the `Stripe-Signature` header before parsing event data.

## Test checklist

- New venue starts a 30-day trial without a card.
- Trial converts to the €19 recurring price after a payment method is added.
- Founder venues remain free forever, including after cancellation of any
  future paid features.
- Free venue is limited to 3 applications per month without blocking QR usage.
- Payment failure removes Pro only after the agreed grace period.
- Pause for one month resumes correctly and does not create duplicate invoices.
- Cancellation at period end preserves access until the period ends.
- Duplicate and out-of-order webhooks are harmless.
- Portal sessions cannot be created for another venue.
- Stripe test mode and live mode use separate products, prices and webhook secrets.

## Current status

There is currently no Stripe package, Edge Function, billing migration, or
webhook endpoint in the repository. The old `BACKEND-ARCHITECTURE.md` describes
an unimplemented Stripe Connect marketplace flow and should not be reused for
this subscription model.
