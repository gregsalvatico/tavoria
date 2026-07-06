# Deploy `notify-on-application`

One-time setup, then `supabase functions deploy` whenever you edit the function.

## 1. Install the Supabase CLI

```bash
brew install supabase/tap/supabase
```

(or see https://supabase.com/docs/guides/cli for other platforms)

## 2. Log in + link this project

From `~/Desktop/gigi/gigi-worker`:

```bash
supabase login
supabase link --project-ref <YOUR-PROJECT-REF>
```

Your project ref is the subdomain in your Supabase URL — e.g. for
`https://abcdefgh.supabase.co`, the ref is `abcdefgh`. Find it in the
Supabase dashboard URL or in Settings → General → Reference ID.

## 3. Set the function's secrets

The function needs the service-role key to read `push_token` columns
(the anon key would be blocked by RLS).

Grab the keys from Supabase dashboard → Settings → API:

- `URL` (e.g. `https://abcdefgh.supabase.co`)
- `service_role` key (NOT anon — service_role)

```bash
supabase secrets set SUPABASE_URL=https://abcdefgh.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

> ⚠️ The service-role key bypasses RLS. Never commit it to git, never put
> it in the mobile app bundle, never send it to a worker user. It only
> lives in the Edge Function environment.

## 4. Deploy the function

```bash
supabase functions deploy notify-on-application --no-verify-jwt
```

`--no-verify-jwt` is correct here — the function is called by a Supabase
Database Webhook, which doesn't carry a user JWT.

After deploying, note the function URL — it's:

```
https://<project-ref>.supabase.co/functions/v1/notify-on-application
```

## 5. Wire up the Database Webhook

In Supabase dashboard → Database → Webhooks → **Create a new hook**:

| Field        | Value                                           |
|--------------|-------------------------------------------------|
| Name         | `notify-on-application`                         |
| Table        | `public.applications`                           |
| Events       | ✅ Insert  ✅ Update                            |
| Type         | **Supabase Edge Functions**                     |
| Method       | `POST`                                          |
| Function     | `notify-on-application`                         |
| HTTP Headers | (leave default)                                 |

Save. Done.

## 6. Test it

From your phone (development build, not Expo Go — push tokens don't fire
in Expo Go on SDK 53+):

1. Sign in as Venue A.
2. Note the OS notification permission prompt — accept.
3. (Behind the scenes, `lib/pushNotifications.ts` saved your token to
   `venues.push_token`.)
4. Sign out → sign in as Worker → apply to a shift at Venue A.
5. Within 1–2 seconds, the venue device gets a push:
   > **Nuova candidatura**
   > Maria si è candidata a uno dei tuoi turni.
6. As Venue, open the candidate and tap **Colloquio** or **Assumi** — the
   worker device gets a push back.

## Logs / debugging

```bash
supabase functions logs notify-on-application --tail
```

If you see `venue has no push token`, the venue row's `push_token` column
is empty — most likely you signed up in Expo Go (which silently skips the
token registration). Use a development build or production build.

If you see `expo push HTTP 400`, the token format is wrong. Check it
starts with `ExponentPushToken[`.
