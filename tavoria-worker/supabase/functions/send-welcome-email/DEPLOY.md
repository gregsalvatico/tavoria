# Deploy `send-welcome-email`

This function sends the generated venue username through Resend after signup.

```bash
supabase login
supabase link --project-ref hmiijnurcvbomfcftnmd
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set RESEND_FROM_EMAIL="Tavoria <hello@tavoriapp.com>"
supabase functions deploy send-welcome-email
```

`RESEND_FROM_EMAIL` must use a sender/domain verified in Resend. For local app
testing, the function can be deployed to the hosted Supabase project; the app
will invoke it using the logged-in Supabase session.
