# Product update emails

`send-product-update-email` sends release/update messages using the same Resend
provider and Tavoria email layout as the existing transactional functions.

## Deploy once

```bash
npx supabase secrets set PRODUCT_UPDATE_EMAIL_SECRET="<long-random-secret>"
npx supabase functions deploy send-product-update-email --no-verify-jwt
```

The function still checks `PRODUCT_UPDATE_EMAIL_SECRET` itself. The secret must
never be committed or exposed in the app bundle.

## Send an update

```bash
curl -X POST "https://hmiijnurcvbomfcftnmd.supabase.co/functions/v1/send-product-update-email" \
  -H "apikey: <supabase-anon-key>" \
  -H "Content-Type: application/json" \
  -H "x-product-update-secret: <long-random-secret>" \
  -d '{
    "to": ["user@example.com"],
    "subject": "Abbiamo migliorato l\u0027app",
    "eyebrow": "Novità Tavoria",
    "title": "Tavoria è migliorata",
    "body": "Abbiamo reso l\u0027app più semplice, veloce e chiara.",
    "detail": "Stiamo anche lavorando per coinvolgere più locali sulla piattaforma.",
    "cta": "Apri Tavoria",
    "url": "https://app.tavoriapp.com/"
  }'
```

Before a broad send, add consent and unsubscribe handling for product updates.
