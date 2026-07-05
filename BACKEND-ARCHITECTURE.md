# Gigi — Production Backend Architecture

A complete blueprint for a billion-dollar hospitality staffing marketplace.

> **Honest framing:** This document is the *target* architecture for a mature platform. Building it all takes a team 6-12 months. The MVP that ships in Milan on June 3-5 is intentionally a thin slice. The "Build now" markers below tell you what to implement before launch; the "Phase 2/3" markers describe what comes next.

---

## 0. Stack & Principles

### Core principles
- **Mobile-first, web-secondary.** Workers and venues live on the mobile app. Web is admin + landing only.
- **Server-of-record is Postgres.** Everything else (search, cache, analytics) reads from it.
- **Idempotency by default.** Every write operation accepts an idempotency key.
- **Audit everything.** Every state-changing operation writes an immutable event.
- **Privacy by design.** Default to least-privilege. Personal data is encrypted at rest and tagged for GDPR export/erasure.
- **Multi-tenant from day one.** Country, currency, locale, timezone, and labor-law rules are first-class.

### Stack

| Layer | Choice | Why |
|---|---|---|
| Mobile app | Expo + React Native | Cross-platform, OTA updates, fast iteration |
| Web (admin, landing) | Next.js 15 (App Router) + Vercel | Server components, edge runtime, easy deploy |
| Database | Postgres on Supabase | Row-level security, realtime, auth, storage in one |
| File storage | Supabase Storage → AWS S3 (when scale demands) | Cheap, fast, signed URLs |
| Search | Postgres + GIN/trigram → Elasticsearch / Typesense when >1M rows | Start simple |
| Cache | Redis (Upstash) | Sessions, rate limits, hot reads |
| Queue / async | Supabase Edge Functions → SQS or Inngest for complex jobs | Simple to start |
| Realtime | Supabase Realtime → Pusher / Ably if needed | Postgres CDC streams |
| Auth | Supabase Auth (email OTP, phone OTP via Twilio, Apple/Google SSO, magic link) | Battle-tested |
| Payments | Stripe Connect (Express accounts) | Marketplace standard, handles KYC, multi-country payouts |
| Notifications push | Expo Push → APNS/FCM | Free up to scale |
| Notifications email | Resend / Postmark | Cheap, deliverable |
| Notifications SMS | Twilio | OTP + critical alerts |
| Geocoding / maps | Mapbox or Google Maps | Address autocomplete, distance |
| Observability | Sentry (errors) + PostHog (product analytics) + Vercel Analytics | Free tiers cover early stage |
| Search rank / matching ML | Custom PostgreSQL functions → vector search (pgvector) → Pinecone | Iterate |
| Background images / moderation | Hive AI or AWS Rekognition | NSFW/violence/face detection |
| Document verification | Onfido or Veriff | Passport/ID checks for KYC |
| Right-to-work check | Trust Stamp (UK/EU) or local equivalents | Per country |
| Translation | i18n JSON in repo + machine translation for long-tail | Manual for top-3 languages |

---

## 1. Database Schema (Postgres)

All tables include:
- `id uuid primary key default gen_random_uuid()`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()` (trigger-maintained)
- `deleted_at timestamptz` (soft delete; index `WHERE deleted_at IS NULL`)

### 1.1 Identity & Auth

```sql
-- Mirror of auth.users with our app-specific data
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('worker','venue_owner','venue_staff','admin','support')),
  primary_locale text not null default 'en',
  primary_country text,        -- ISO 3166-1 alpha-2: 'IT','FR','ES'
  primary_timezone text,       -- e.g. 'Europe/Rome'
  email text,
  phone_e164 text,
  email_verified_at timestamptz,
  phone_verified_at timestamptz,
  last_seen_at timestamptz,
  marketing_consent_at timestamptz,
  data_processing_consent_at timestamptz not null,
  terms_version_accepted text not null,
  privacy_version_accepted text not null,
  -- GDPR
  deletion_requested_at timestamptz,
  deletion_scheduled_at timestamptz,
  data_export_requested_at timestamptz
);

-- Many-to-many: a user can belong to multiple venues (multi-location operator)
create table venue_members (
  venue_id uuid references venues(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  role text not null check (role in ('owner','manager','recruiter','reviewer')),
  permissions jsonb not null default '[]'::jsonb,   -- ['post_shifts','hire','message','view_payments',...]
  invited_by uuid references users(id),
  invited_at timestamptz default now(),
  joined_at timestamptz,
  removed_at timestamptz,
  primary key (venue_id, user_id)
);
```

### 1.2 Workers — full professional profile

```sql
create table workers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,

  -- Identity
  first_name text not null,
  last_name text,
  display_name text,                -- shown to venues (privacy preserving)
  date_of_birth date,
  age_range text,                   -- '18-20','21-25', etc. (for venues; DOB never exposed)
  gender text,                      -- 'female','male','non-binary','prefer-not-say'
  pronouns text,
  nationality text,                 -- ISO 3166-1 alpha-2
  spoken_languages jsonb not null default '[]'::jsonb,
    -- [{code:'IT',level:'native'},{code:'EN',level:'C1'},{code:'FR',level:'B2'}]
  preferred_contact_method text default 'push',  -- 'push','email','sms','whatsapp'

  -- Location
  current_city text,
  current_country text,
  current_address_line text,        -- never exposed to venues; for matching only
  current_lat numeric(9,6),
  current_lng numeric(9,6),
  willing_to_travel_km int default 10,
  willing_to_relocate boolean default false,

  -- Right to work
  right_to_work_country text[],     -- which countries they can legally work in
  right_to_work_proof_doc_id uuid references documents(id),
  right_to_work_verified_at timestamptz,
  right_to_work_expires_at date,
  visa_type text,                    -- 'eu_citizen','student','work_permit','other'

  -- Work profile
  positions text[] not null default '{}',          -- ['barista','waiter','bartender','sommelier']
  primary_position text,
  custom_positions text[],                          -- ['sushi chef','cocktail barman']
  years_experience int,
  experience_band text,                             -- '0-1','1-2','3-5','5-10','10+'
  experience_history jsonb default '[]'::jsonb,    -- [{venue,role,from,to,city,country,reference_contact}]
  certifications jsonb default '[]'::jsonb,        -- [{name:'HACCP',issued:'2024-03',expires:'2027-03',doc_id}]
  specialties text[],                              -- ['italian wine','latte art','table service']
  shift_types_open_to text[],                       -- ['one-off','daily','part-time','full-time','seasonal','event']
  industries text[],                                -- ['cafe','restaurant','bar','hotel','club','beach','catering']
  venue_levels_open_to text[],                      -- ['casual','busy','upscale','luxury']

  -- Compensation expectations
  min_hourly_rate numeric(8,2),
  min_daily_rate numeric(8,2),
  min_monthly_rate numeric(10,2),
  currency text default 'EUR',
  accepts_tips_only boolean default false,
  has_own_tools boolean default false,             -- e.g. own knife kit, own uniform

  -- Soft profile
  personality_traits text[],                       -- output of personality quiz
  strengths text[],
  bio text,                                         -- short blurb shown on card
  bio_machine_translated jsonb,                    -- {it:'...',fr:'...'} for cross-language search

  -- Media
  photo_url text,
  photo_moderation_status text default 'pending',  -- 'pending','approved','rejected'
  photo_moderation_reason text,
  additional_photos jsonb default '[]'::jsonb,     -- [{url, type:'action'|'smile'|'environment', moderation_status}]
  intro_video_url text,
  intro_video_duration_sec int,
  intro_video_transcript text,                     -- speech-to-text for matching + accessibility
  intro_video_moderation_status text default 'pending',
  pitch_video_url text,
  language_demo_video_url text,
  documents jsonb default '[]'::jsonb,             -- [{id, type:'cv'|'reference'|'id', file_path, badge:'verified'|'vouched'}]

  -- Availability
  weekly_availability jsonb,                       -- {mon:[{from:'08:00',to:'14:00'}],tue:[...]}
  blocked_dates date[],                            -- can't work these days
  active_until date,                               -- "I'm available until this date"
  instant_book_enabled boolean default true,       -- venue can hire without interview
  notice_period_hours int default 0,               -- minimum lead time before a shift

  -- Verification & trust
  identity_verified_at timestamptz,
  email_verified_at timestamptz,
  phone_verified_at timestamptz,
  background_check_status text default 'none',     -- 'none','requested','passed','failed'
  background_check_date date,
  references_verified_count int default 0,
  vouched_by_venues uuid[] default '{}',           -- venues that gave a reference

  -- Ratings (denormalized for fast reads)
  rating_avg numeric(3,2),
  rating_count int default 0,
  show_up_rate numeric(5,4),                       -- % of accepted shifts they actually showed up to
  cancellation_rate numeric(5,4),
  on_time_rate numeric(5,4),
  reliability_score int,                           -- 0-100 composite

  -- Search & matching
  searchable_text tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(first_name,'') || ' ' || coalesce(last_name,'')), 'A') ||
    setweight(to_tsvector('simple', array_to_string(positions, ' ')), 'B') ||
    setweight(to_tsvector('simple', array_to_string(custom_positions, ' ')), 'B') ||
    setweight(to_tsvector('simple', coalesce(bio,'')), 'C')
  ) stored,
  embedding vector(1536),                          -- pgvector — for semantic match

  -- Status
  profile_status text not null default 'draft' check (profile_status in ('draft','live','paused','suspended','banned')),
  pause_reason text,
  suspended_at timestamptz,
  suspended_reason text
);

create index workers_search_idx on workers using gin(searchable_text);
create index workers_loc_idx on workers using gist (point(current_lng, current_lat));
create index workers_positions_idx on workers using gin(positions);
create index workers_embedding_idx on workers using ivfflat(embedding vector_cosine_ops);
```

### 1.3 Venues — full operational profile

```sql
create table venues (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references users(id),

  -- Identity
  legal_name text not null,
  display_name text not null,                       -- public name on app
  confidential_mode boolean default false,          -- hide name from public listings (paid feature)
  brand_slug text unique,                           -- URL handle
  venue_type text not null,                         -- 'cafe','bar','restaurant','hotel','club','beach_club'
  cuisine_type text[],                              -- 'italian','japanese','french','fusion'
  venue_style text,                                 -- 'casual','busy','upscale','luxury'
  business_registration_number text,                -- VAT / tax ID
  vat_number text,
  founded_year int,
  size_employees text,                              -- '1-5','5-20','20-100','100+'
  is_chain boolean default false,
  parent_chain_id uuid references venues(id),       -- if part of a chain
  brand_logo_url text,

  -- Location
  address_line1 text not null,
  address_line2 text,
  city text not null,
  region text,
  postcode text,
  country text not null,
  lat numeric(9,6),
  lng numeric(9,6),
  timezone text not null,                           -- 'Europe/Rome'
  neighborhood text,                                -- for matching by area

  -- Contact
  contact_email text not null,
  contact_phone text,
  whatsapp_phone text,
  website_url text,
  instagram_handle text,

  -- Operational
  opening_hours jsonb,                              -- {mon:[{from:'08:00',to:'23:00'}],...}
  peak_hours jsonb,                                 -- when they typically need extra staff
  capacity_seats int,
  positions_hired_for text[] default '{}',
  custom_positions_hired_for text[],
  pay_schedule text,                                -- 'daily','weekly','monthly'
  default_currency text default 'EUR',
  default_hourly_rate numeric(8,2),
  default_daily_rate numeric(8,2),
  uniform_provided boolean default false,
  meal_provided boolean default false,
  transport_provided boolean default false,
  parking_available boolean default false,

  -- Media
  cover_photo_url text,
  photos jsonb default '[]'::jsonb,                 -- gallery
  intro_video_url text,

  -- Verification & trust
  identity_verified_at timestamptz,
  business_doc_verified_at timestamptz,
  business_doc_id uuid references documents(id),
  address_verified_at timestamptz,
  stripe_account_id text,
  stripe_account_status text,                       -- 'pending','active','restricted'
  stripe_payouts_enabled boolean default false,

  -- Ratings
  rating_avg numeric(3,2),
  rating_count int default 0,
  hire_response_time_hours numeric(6,2),            -- avg time from application to first response
  hire_rate numeric(5,4),                            -- % of applicants hired
  ghost_rate numeric(5,4),                           -- % of applicants never responded to

  -- Compliance
  insurance_provider text,
  insurance_policy_number text,
  insurance_expires_at date,
  health_safety_cert_id uuid references documents(id),

  -- Status
  status text not null default 'draft' check (status in ('draft','live','paused','suspended','banned')),
  pause_reason text,

  -- Search & matching
  searchable_text tsvector generated always as (
    setweight(to_tsvector('simple', display_name), 'A') ||
    setweight(to_tsvector('simple', coalesce(neighborhood,'') || ' ' || city), 'B') ||
    setweight(to_tsvector('simple', array_to_string(positions_hired_for, ' ')), 'C')
  ) stored,
  embedding vector(1536)
);

create index venues_loc_idx on venues using gist(point(lng, lat));
create index venues_search_idx on venues using gin(searchable_text);
create index venues_country_city_idx on venues(country, city);
```

### 1.4 Shifts

```sql
create table shifts (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues(id) on delete cascade,
  created_by_user_id uuid not null references users(id),

  -- What
  title text,                                       -- optional display title
  positions text[] not null,
  primary_position text,
  description text,
  description_machine_translated jsonb,
  required_experience_band text,
  required_languages jsonb,                         -- [{code:'IT',level:'B1'}]
  required_certifications text[],
  uniform_dress_code text,
  tools_required text[],
  venue_style_required text,                        -- inherited from venue but can override

  -- When
  starts_at timestamptz not null,                   -- specific date+time in venue timezone
  ends_at timestamptz not null,
  duration_minutes int,                             -- computed
  recurring_pattern jsonb,                          -- {days:['mon','wed','fri'],until:'2026-08-01'}
  urgency text default 'standard' check (urgency in ('asap','urgent','standard','scheduled')),
    -- asap = sick-call now; urgent = today; standard = within 48h; scheduled = future
  filled_by_count int default 0,
  positions_needed int default 1,

  -- Pay
  pay_amount numeric(10,2),
  pay_unit text check (pay_unit in ('hour','day','week','month','flat','later')),
  currency text default 'EUR',
  tips_expected boolean,
  meal_break_paid boolean,

  -- Contract
  contract_type text,                                -- 'one-off','two-day','part-time','full-time','seasonal','event','trial'
  contract_template_id uuid references contract_templates(id),

  -- Matching
  visible_to_levels text[],                          -- which worker experience bands can see this
  invitation_only boolean default false,             -- only invited workers can apply
  invited_worker_ids uuid[] default '{}',
  auto_match_enabled boolean default true,           -- send to top N matched workers proactively
  auto_match_radius_km int default 5,

  -- Status & lifecycle
  status text not null default 'draft' check (status in
    ('draft','live','filled','cancelled','expired','completed')),
  posted_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  completed_at timestamptz,

  -- Performance
  application_count int default 0,
  view_count int default 0
);

create index shifts_live_idx on shifts(venue_id, status) where status='live';
create index shifts_starts_at_idx on shifts(starts_at) where status in ('live','filled');
create index shifts_urgency_idx on shifts(urgency, posted_at desc) where status='live';
```

### 1.5 Applications & Hires

```sql
create table applications (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references workers(id),
  venue_id uuid not null references venues(id),
  shift_id uuid references shifts(id),                -- nullable for "open application"
  source text not null check (source in ('qr_scan','discover_swipe','venue_invite','direct_search','referral')),

  -- Worker-supplied
  cover_message text,
  attached_video_url text,                            -- shift-specific intro

  -- Status machine
  status text not null default 'pending' check (status in
    ('pending','venue_viewed','shortlisted','interview_requested','interview_scheduled',
     'hired','declined','withdrawn','no_show','completed','disputed')),
  status_history jsonb default '[]'::jsonb,           -- timeline of status changes with actor + reason
  starred boolean default false,                       -- PRO feature

  -- Venue actions
  viewed_at timestamptz,
  responded_at timestamptz,
  decision_by_user_id uuid references users(id),
  decision_reason text,

  -- Interview
  interview_type text,                                 -- 'in_app_video','phone','in_person','async_video'
  interview_scheduled_at timestamptz,
  interview_meeting_url text,
  interview_notes text,

  -- Hire
  hired_at timestamptz,
  hire_contract_id uuid references contracts(id),
  hire_signed_by_worker_at timestamptz,
  hire_signed_by_venue_at timestamptz,

  -- Match score (computed at insert; updates on profile change)
  match_score numeric(5,2),
  match_factors jsonb,                                  -- {distance:0.9, experience:0.7, languages:1.0, ...}

  unique (worker_id, shift_id)
);

create index applications_venue_pending_idx on applications(venue_id, status, created_at desc) where status='pending';
create index applications_worker_status_idx on applications(worker_id, status);
```

### 1.6 Contracts & e-signatures

```sql
create table contract_templates (
  id uuid primary key default gen_random_uuid(),
  country text not null,                              -- different legal templates per country
  language text not null,
  contract_type text not null,                        -- 'one_off','part_time','seasonal',...
  title text not null,
  body_markdown text not null,                        -- template with {{placeholders}}
  required_fields jsonb not null,                     -- which fields the venue must fill
  jurisdiction text,                                  -- legal jurisdiction clause
  version int not null,
  effective_from date not null,
  effective_to date,
  reviewed_by_lawyer_at timestamptz,
  reviewed_by text                                    -- law firm name
);

create table contracts (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references contract_templates(id),
  venue_id uuid not null references venues(id),
  worker_id uuid not null references workers(id),
  shift_id uuid references shifts(id),
  application_id uuid references applications(id),

  filled_fields jsonb not null,                       -- {hours:8, rate:15, location:'...'}
  rendered_html text not null,                        -- final document
  pdf_url text,                                       -- archived PDF
  pdf_hash text,                                      -- SHA256 for tamper detection

  signature_worker_at timestamptz,
  signature_worker_method text,                       -- 'in_app_typed','docusign','manual'
  signature_worker_ip inet,
  signature_worker_geo text,
  signature_venue_at timestamptz,
  signature_venue_method text,
  signature_venue_ip inet,
  signature_venue_geo text,

  status text not null default 'draft' check (status in
    ('draft','sent','partially_signed','fully_signed','rejected','expired','terminated')),
  expires_at timestamptz,
  superseded_by_contract_id uuid references contracts(id),
  termination_reason text
);
```

### 1.7 Time tracking & attendance

```sql
create table shift_attendance (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references shifts(id),
  application_id uuid not null references applications(id),
  worker_id uuid not null references workers(id),

  expected_start_at timestamptz not null,
  expected_end_at timestamptz not null,

  -- Check-in / out (geofenced)
  check_in_at timestamptz,
  check_in_lat numeric(9,6),
  check_in_lng numeric(9,6),
  check_in_method text,                               -- 'app_geofence','venue_qr','manual_venue'
  check_in_distance_m numeric(8,2),                   -- distance from venue at check-in
  check_out_at timestamptz,
  check_out_lat numeric(9,6),
  check_out_lng numeric(9,6),

  break_minutes int default 0,
  worked_minutes int,                                  -- computed

  status text not null default 'scheduled' check (status in
    ('scheduled','checked_in','on_break','checked_out','no_show','left_early','disputed')),

  -- Approvals
  venue_approved_at timestamptz,
  venue_approved_by uuid references users(id),
  worker_disputed_at timestamptz,
  worker_dispute_reason text,
  resolved_at timestamptz,
  resolved_by uuid references users(id),
  resolution_minutes int                                -- final agreed worked minutes
);
```

### 1.8 Payments (Stripe Connect)

```sql
create table payment_invoices (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues(id),
  worker_id uuid not null references workers(id),
  contract_id uuid not null references contracts(id),
  shift_id uuid references shifts(id),
  attendance_id uuid references shift_attendance(id),

  gross_amount numeric(10,2) not null,                -- what venue pays
  worker_net_amount numeric(10,2) not null,           -- what worker receives
  platform_fee_amount numeric(10,2) not null,         -- our take
  platform_fee_rate numeric(5,4) not null,            -- e.g. 0.10 = 10%
  payment_processor_fee_amount numeric(10,2),
  tax_amount numeric(10,2),                            -- VAT or withholding
  tip_amount numeric(10,2) default 0,
  currency text not null,

  stripe_payment_intent_id text,
  stripe_transfer_id text,                             -- transfer to worker's Stripe account
  stripe_charge_id text,

  status text not null default 'pending' check (status in
    ('pending','venue_charged','transferred_to_worker','paid_out','refunded','disputed','failed')),
  charged_at timestamptz,
  transferred_at timestamptz,
  paid_out_at timestamptz,
  failure_reason text
);

create table payouts (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references workers(id),
  stripe_payout_id text unique,
  amount numeric(10,2) not null,
  currency text not null,
  arrival_date date,
  status text not null,                                -- 'pending','in_transit','paid','failed'
  bank_last4 text,
  invoice_ids uuid[] not null                          -- which invoices this payout covers
);

create table tax_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  country text not null,
  document_type text not null,                         -- 'p60','1099','annual_summary','vat_invoice'
  tax_year int not null,
  pdf_url text not null,
  generated_at timestamptz default now()
);
```

### 1.9 Ratings & reviews (two-sided)

```sql
create table ratings (
  id uuid primary key default gen_random_uuid(),
  rater_user_id uuid not null references users(id),
  rated_user_id uuid references users(id),             -- nullable: rated entity could be a venue
  rated_venue_id uuid references venues(id),
  rated_worker_id uuid references workers(id),
  shift_id uuid references shifts(id),
  attendance_id uuid references shift_attendance(id),

  overall numeric(2,1) not null check (overall between 1 and 5),
  punctuality numeric(2,1),
  professionalism numeric(2,1),
  skill numeric(2,1),
  communication numeric(2,1),
  hygiene numeric(2,1),
  fair_treatment numeric(2,1),                          -- worker rating venue: were they treated fairly
  pay_on_time numeric(2,1),                             -- worker rating venue
  comment text,
  comment_translated jsonb,
  is_private boolean default false,                     -- shown only to platform, not to other party
  flagged boolean default false,

  check (rated_user_id is not null or rated_venue_id is not null or rated_worker_id is not null)
);

-- Trigger: on insert/update, recompute denormalized rating_avg on the rated entity.
```

### 1.10 Messaging

```sql
create table conversations (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues(id),
  worker_id uuid not null references workers(id),
  shift_id uuid references shifts(id),
  application_id uuid references applications(id),
  last_message_at timestamptz,
  last_message_preview text,
  unread_count_venue int default 0,
  unread_count_worker int default 0,
  archived_by_venue boolean default false,
  archived_by_worker boolean default false,
  unique (venue_id, worker_id, shift_id)
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_user_id uuid not null references users(id),
  sender_role text not null check (sender_role in ('worker','venue','system')),
  body text,
  body_translated jsonb,
  attachments jsonb default '[]'::jsonb,                -- [{type:'image|voice|document', url, mime}]
  message_type text default 'text' check (message_type in
    ('text','interview_invite','hire_offer','contract','attendance_reminder','system_notice')),
  payload jsonb,                                        -- structured data for system messages
  read_at timestamptz,
  delivered_at timestamptz default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  flagged_for_review boolean default false,
  moderation_status text                                -- 'clean','suspicious','blocked'
);

create index messages_conversation_idx on messages(conversation_id, delivered_at desc);
```

### 1.11 Notifications

```sql
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  category text not null,                               -- 'application','hire','payment','message','system','marketing'
  channel text not null check (channel in ('push','email','sms','in_app','whatsapp')),
  template_key text not null,                           -- references templates per language
  title text not null,
  body text not null,
  deep_link text,                                       -- 'gigi://shift/abc123'
  payload jsonb,
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  status text not null default 'queued' check (status in
    ('queued','sent','delivered','failed','suppressed')),
  failure_reason text,
  expo_push_ticket_id text,
  resend_message_id text,
  twilio_sid text
);

create table notification_preferences (
  user_id uuid primary key references users(id) on delete cascade,
  push_enabled boolean default true,
  email_enabled boolean default true,
  sms_enabled boolean default true,
  whatsapp_enabled boolean default false,
  marketing_email boolean default false,
  quiet_hours_start time,                               -- e.g. 22:00
  quiet_hours_end time,                                 -- e.g. 08:00
  category_overrides jsonb default '{}'::jsonb           -- per-category opt out
);
```

### 1.12 Documents & media (encrypted)

```sql
create table documents (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references users(id),
  doc_type text not null,                                -- 'id_passport','id_card','cv','reference_letter','business_reg','insurance','certification'
  storage_path text not null,                            -- S3 path (encrypted at rest)
  filename text,
  mime_type text,
  size_bytes bigint,
  encryption_key_id text,                                -- KMS key reference (envelope encryption)
  expires_at date,
  ocr_text text,                                         -- extracted text for search
  verification_status text default 'pending' check (verification_status in
    ('pending','verified','rejected','expired')),
  verification_method text,                              -- 'onfido','manual_admin','vouched_by_admin'
  verification_provider_ref text,                        -- Onfido check ID
  verified_at timestamptz,
  verified_by uuid references users(id),
  rejection_reason text,
  badge_issued text                                      -- 'verified','vouched','certified'
);
```

### 1.13 Audit log (immutable)

```sql
create table audit_events (
  id bigserial primary key,
  occurred_at timestamptz not null default now(),
  actor_user_id uuid references users(id),
  actor_role text,
  actor_ip inet,
  actor_user_agent text,
  action text not null,                                  -- 'application.hired','venue.suspended','payment.charged','user.deleted'
  entity_type text not null,
  entity_id uuid not null,
  before jsonb,                                          -- state before
  after jsonb,                                           -- state after
  metadata jsonb,
  request_id text                                        -- correlate with logs
);

create index audit_entity_idx on audit_events(entity_type, entity_id, occurred_at desc);
create index audit_actor_idx on audit_events(actor_user_id, occurred_at desc);

-- Forbid updates and deletes via RLS / trigger:
alter table audit_events enable row level security;
create policy "audit_no_modify" on audit_events for all using (false) with check (true);
```

### 1.14 Fraud signals

```sql
create table fraud_signals (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,                             -- 'user','venue','worker','application','payment'
  entity_id uuid not null,
  signal_type text not null,                             -- 'duplicate_device','suspicious_velocity','ip_reputation','payment_chargeback','identity_mismatch','fake_photo','review_bombing'
  severity int not null,                                 -- 0-100
  evidence jsonb,
  detected_at timestamptz default now(),
  resolved_at timestamptz,
  resolution text,                                       -- 'false_positive','warning','suspended','banned'
  resolved_by uuid references users(id)
);

create table devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  device_fingerprint text not null,                      -- combined hash of device chars
  platform text,                                          -- 'ios','android'
  os_version text,
  model text,
  push_token text,
  ip_address inet,
  country_seen text,
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz,
  unique (user_id, device_fingerprint)
);
```

### 1.15 CRM (admin)

```sql
create table crm_accounts (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('venue','worker','prospect')),
  entity_id uuid,                                        -- may be null for prospects not yet in app
  prospect_name text,
  prospect_email text,
  prospect_phone text,
  stage text not null,                                   -- 'lead','contacted','demo_scheduled','onboarded','active','churned'
  source text,                                           -- 'cold_outreach','referral','organic_signup','event'
  owner_user_id uuid references users(id),               -- assigned sales rep
  next_followup_at timestamptz,
  lifetime_value numeric(12,2) default 0,
  notes text
);

create table crm_activities (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references crm_accounts(id),
  user_id uuid not null references users(id),
  activity_type text not null,                            -- 'call','email','meeting','demo','note'
  subject text,
  body text,
  occurred_at timestamptz default now(),
  outcome text                                            -- 'positive','no_response','rejected','converted'
);
```

### 1.16 Misc

```sql
-- Referrals (worker invites worker, venue invites venue)
create table referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references users(id),
  referee_email text,
  referee_phone text,
  referee_user_id uuid references users(id),
  referral_code text unique,
  status text not null default 'pending',                 -- 'pending','signed_up','completed','reward_paid'
  signed_up_at timestamptz,
  first_action_at timestamptz,                            -- first hire / first shift completed
  reward_amount numeric(8,2),
  reward_paid_at timestamptz
);

-- Promo codes / discounts
create table promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type text not null,                            -- 'percent_off_platform_fee','flat_credit'
  discount_value numeric(8,2) not null,
  applies_to text not null,                               -- 'venue','worker'
  max_redemptions int,
  redemption_count int default 0,
  valid_from timestamptz,
  valid_until timestamptz,
  created_by uuid references users(id)
);

-- Saved searches & alerts
create table saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  name text,
  query jsonb not null,                                   -- {positions:[...], radius_km:5, min_rating:4}
  alert_frequency text,                                   -- 'instant','daily','weekly','off'
  last_alerted_at timestamptz
);

-- Feature flags
create table feature_flags (
  key text primary key,
  enabled_globally boolean default false,
  enabled_for_user_ids uuid[] default '{}',
  enabled_for_countries text[] default '{}',
  rollout_percentage int default 0
);
```

---

## 2. API surface

### Conventions
- REST for entity CRUD, RPC (Supabase functions) for complex operations
- All endpoints return `{ data, error, meta }`
- All write endpoints accept `Idempotency-Key` header
- Cursor-based pagination (`cursor`, `limit`, `has_more`)
- Versioned: `/v1/...`

### Key endpoints (illustrative subset)

```
# Identity
POST   /v1/auth/signup              { method:'email'|'phone', value, role }
POST   /v1/auth/verify-otp          { method, value, code }
POST   /v1/auth/refresh
POST   /v1/auth/logout
POST   /v1/auth/social/{provider}   { id_token }
POST   /v1/users/me/consents        { terms_version, privacy_version, marketing }

# Workers
GET    /v1/workers/me
PATCH  /v1/workers/me
POST   /v1/workers/me/photo         (multipart) → moderation pipeline
POST   /v1/workers/me/intro-video   (multipart) → moderation + transcript
GET    /v1/workers/me/applications
GET    /v1/workers/me/payouts
POST   /v1/workers/me/availability/replace  { weekly, blocked_dates }

# Venues
POST   /v1/venues                   create venue
GET    /v1/venues/{id}
PATCH  /v1/venues/{id}
POST   /v1/venues/{id}/members      invite team member
POST   /v1/venues/{id}/stripe-onboard  → returns Stripe Connect link
POST   /v1/venues/{id}/qr/generate   generate printable QR PDF

# Shifts
POST   /v1/shifts                   create shift
GET    /v1/shifts                   discovery feed (filters)
GET    /v1/shifts/{id}
PATCH  /v1/shifts/{id}
POST   /v1/shifts/{id}/cancel
POST   /v1/shifts/{id}/duplicate

# Discovery & matching
GET    /v1/discover/shifts          worker browse (geo + filters)
GET    /v1/discover/workers         venue browse (paid feature)
POST   /v1/match/recompute          admin: rebuild matching for a shift

# Applications
POST   /v1/applications             worker applies
GET    /v1/applications/{id}
POST   /v1/applications/{id}/view   venue marks viewed
POST   /v1/applications/{id}/shortlist
POST   /v1/applications/{id}/interview { type, scheduled_at }
POST   /v1/applications/{id}/hire   → generates contract
POST   /v1/applications/{id}/decline { reason }
POST   /v1/applications/{id}/withdraw

# Contracts
GET    /v1/contracts/{id}
POST   /v1/contracts/{id}/sign      worker or venue signs
POST   /v1/contracts/{id}/terminate

# Attendance
POST   /v1/attendance/{id}/check-in   (geofenced)
POST   /v1/attendance/{id}/check-out
POST   /v1/attendance/{id}/approve    venue confirms hours
POST   /v1/attendance/{id}/dispute

# Payments
POST   /v1/payments/charge          system-triggered after attendance approval
GET    /v1/payouts/me
POST   /v1/payouts/instant          PRO feature

# Messaging
GET    /v1/conversations
POST   /v1/messages                 { conversation_id, body }
POST   /v1/messages/{id}/flag

# Ratings
POST   /v1/ratings                  { rated_*, scores }

# Admin
GET    /v1/admin/dashboard          aggregate stats
GET    /v1/admin/venues             with filters
POST   /v1/admin/venues/{id}/suspend { reason }
POST   /v1/admin/users/{id}/force-logout
POST   /v1/admin/payments/{id}/refund

# Webhooks (incoming)
POST   /v1/webhooks/stripe
POST   /v1/webhooks/twilio
POST   /v1/webhooks/onfido
```

### Realtime channels (Supabase)
- `conversations:{conversation_id}` — new message events
- `applications:venue:{venue_id}` — new application notifications
- `shifts:venue:{venue_id}` — applicant count updates
- `notifications:user:{user_id}` — in-app banners
- `attendance:shift:{shift_id}` — live check-in/out updates

---

## 3. Permissions (RLS policies)

Every table has Row-Level Security on. Highlights:

- **workers**: read own row freely; venue can read only via a related application or invitation; admin sees all.
- **venues**: public read for `live` + non-confidential; venue members read full record; admin sees all.
- **shifts**: anyone authenticated can read live shifts within their visible-to-levels; only venue members can write.
- **applications**: worker reads own; venue members on the matching venue read their applications; both can update certain fields (worker can withdraw, venue can change status).
- **payment_invoices**: worker reads own (net amount only); venue members read own (gross + fee); admin sees all.
- **messages**: both parties of the conversation can read/write; admin can read flagged only (audit-logged).
- **audit_events**: insert only via security definer functions; readable by admin only.

Application-level permissions enforce things RLS can't (e.g. only `manager` and `owner` can hire; `recruiter` can only message and shortlist).

---

## 4. Core flows

### 4.1 Worker onboarding (mobile)
1. Splash → language pick
2. Sign up (phone OTP preferred for EU; email fallback)
3. Consent gates (T&Cs, privacy, GDPR data processing)
4. Identity quick: name, DOB, nationality, right-to-work proof upload (optional, gives badge)
5. Positions: pick 1-3 + experience band + custom positions text
6. Languages + city + travel radius
7. Personality quiz (optional, 16Q)
8. Coached intro video (30s)
9. Profile photo (with moderation pipeline)
10. Pay expectations + availability calendar
11. Live: discoverable by venues

### 4.2 Venue onboarding (mobile)
1. Sign up (email)
2. Venue type tile (cafe/bar/restaurant/hotel/club/beach)
3. Contact: name, address (autocomplete), email, phone, optional photo
4. Venue style picker
5. Positions you hire for + custom positions
6. Pay schedule
7. Optional: business doc upload + Stripe Connect onboarding (gives badges; required before hiring)
8. Live: can post shifts

### 4.3 Shift posting → hire (full flow)
1. Venue creates shift (positions, when, pay, urgency)
2. Matching engine scores candidates → top N pushed via notification (ASAP shifts radius 1km, 5min push burst)
3. Workers see in discover feed; apply (with optional video pitch)
4. Application creates conversation + venue notified
5. Venue reviews, shortlists, optional interview (in-app video call), decides
6. Hire → contract auto-generated from template → both sign
7. Worker check-in (geofenced) at start, check-out at end
8. Venue approves hours
9. Payment captured from venue → minus fees → transferred to worker's Stripe Connect account
10. Both rate each other (mutual reveal after 24h)

### 4.4 ASAP urgent flow (the killer use case)
1. Venue taps "Need someone now"
2. Shift status = `urgent`, starts_at = now()+30min
3. Engine selects: top 20 nearby workers (radius 2km), available right now, instant-book on, response_rate > 70%
4. Push notification fired with sound override (override DND for opted-in workers)
5. First-come hire: first to tap "Accept" gets it, others see "Filled"
6. Geofenced check-in within 60min or auto-flagged

---

## 5. Verification, KYC, compliance

- **Worker identity**: Onfido or Veriff for passport/ID + selfie. Issues "Verified" badge.
- **Worker right-to-work**: per-country logic (EU passport = automatic; non-EU = visa doc + expiry tracking; UK = Right to Work share-code).
- **Worker background check**: optional, paid feature. Connects to local provider (DBS in UK, Casellario in IT).
- **Venue business verification**: VAT/business reg cross-check (e.g. Italian "Visura Camerale"), insurance doc, photo of venue from outside.
- **Document encryption**: envelope encryption with KMS. Files in S3 with bucket policy denying public read; signed URLs only, 5min TTL, on-demand decryption.
- **Document retention**: per GDPR — kept while account active + 7 years for tax/labor compliance, then purged. Configurable per country.

### Country-specific labor compliance
- **Italy**: payroll/contract templates, INPS contributions for full-time, prestazione occasionale up to €5k/year, codice fiscale required.
- **France**: contrat saisonnier templates, URSSAF declarations, CESU for some categories.
- **Spain**: TGSS registration, modelo TC1.
- **UK**: PAYE for employees vs. self-employed sole traders, IR35 considerations, NI numbers.

Contracts pull from `contract_templates` matching `(country, contract_type, language)`. Updates require lawyer review (`reviewed_by_lawyer_at`).

---

## 6. Notifications & messaging engine

### Channels & priority
1. **In-app realtime** (always-on while app open)
2. **Push** (expo-push → APNS/FCM; sound override for ASAP-urgent if user opted in)
3. **Email** (Resend; for hire offers, contracts, receipts, GDPR exports)
4. **SMS** (Twilio; for OTP, hire confirmation backup, ASAP override)
5. **WhatsApp Business API** (optional; growing in Italy)

### Smart routing
- Quiet hours respected per `notification_preferences`
- ASAP shifts bypass quiet hours only if `category_overrides.asap_override = true`
- De-dupe: if user opens app within 5min of a push, suppress redundant email
- Localization: template_key + locale resolves to translated body
- A/B testing per template version

### Anti-spam moderation (messages)
- Outbound messages classified by simple toxicity + PII-leak detection
- Words flagged: phone numbers (workaround attempt), external app handles ("call me on Telegram") — soft warning before sending; admin notified if user has 3+ flags
- Voice messages transcribed for moderation

---

## 7. Payments architecture (Stripe Connect)

### Flow
1. Venue completes Stripe Connect onboarding (Express account)
2. Worker completes their Connect onboarding (Express account; needs IBAN + ID for KYC)
3. On hire, contract specifies pay; on shift completion + venue approval, payment is created
4. We charge venue (Stripe PaymentIntent) for `gross_amount`
5. Funds settle to platform Stripe balance
6. We transfer to worker's Connect account for `net_amount = gross - platform_fee - processor_fee - tax_withholding`
7. Stripe payouts daily to worker's bank
8. Tax docs auto-generated at year-end

### Fee model (illustrative; adjust per market)
- Free tier: 1 shift/month per venue, capped at €500/month gross — free
- Pay-as-you-go: 7% platform fee per hire
- Pro (€49/mo per venue): 4% fee + unlimited shifts + Star feature + analytics
- Enterprise: custom

### Edge cases
- Refunds: if shift cancelled <24h before, venue charged 25% no-show fee; if cancelled by worker, worker reliability score drops
- Disputes: hours mismatched → frozen invoice until admin resolves
- Chargebacks: Stripe handles; we automatically deduct from next payout to worker if confirmed fraud
- Failed payouts: retry x3 then notify worker to fix bank details

---

## 8. Matching algorithm

### v1 (rule-based, ship for Milan)
Score = weighted sum:
- 30% distance (closer = higher; falls off after 5km)
- 20% positions match (exact match > related)
- 15% experience band match
- 15% language overlap
- 10% availability (free during shift hours)
- 10% reliability (show_up_rate, rating_avg)

Filter out: paused, suspended, opposite-level, blocked-dates, already-applied-to-this-venue-in-last-30d-and-declined.

### v2 (ML, phase 2)
- Train on historical hires: `(shift_features, worker_features) → hired_yes_no` and `(...) → showed_up_yes_no`
- Models: gradient boosted trees (LightGBM) for ranking
- Embeddings for "vibe match": worker bio + venue description → pgvector cosine similarity

### v3 (generative AI)
- Personalized push copy ("Bar Centrale needs a barista, your favorite vibe — apply in 1 tap")
- Auto-generated cover messages worker can edit
- Smart shift descriptions for venues ("Based on your venue style, here's a draft...")

---

## 9. Multi-country, i18n, currency

- `users.primary_country` + `users.primary_locale` set at signup, overridable
- Strings live in `lib/locales/{en,it,fr,es,de,pt}.ts`, hot-swappable
- All money fields carry `currency`; aggregates use FX rates table (daily ECB feed)
- All datetimes stored UTC; rendered in venue/worker timezone
- Phone numbers stored E.164; validated with `libphonenumber`
- Address autocomplete via Mapbox (returns ISO country code → drives contract template selection)

---

## 10. GDPR / privacy

- **Lawful basis tracking**: per data field, mark consent or contract or legitimate interest
- **Data export**: `POST /v1/users/me/export` → kicks off async job → emails ZIP download in 48h
- **Data erasure**: `POST /v1/users/me/delete` → soft-delete immediately, hard-delete after 30-day grace, retain only tax records (anonymized)
- **Right to rectification**: editable profile, audit trail of changes
- **Right to portability**: export in JSON + CSV
- **DPO contact**: surfaced in app + email footer
- **Cookie consent**: web only; granular categories
- **Breach notification**: monitoring on `audit_events` + `fraud_signals`; if confirmed PII exposure, 72h notification to regulator + affected users
- **Sub-processor list**: maintained in Privacy Policy (Supabase, Stripe, Twilio, Resend, Sentry, etc.)
- **Data residency**: EU users → Supabase EU region; non-EU users → US region (no PII transfer across borders without SCCs)

---

## 11. Fraud prevention

### Signals collected
- Device fingerprinting (FingerprintJS Pro or equivalent)
- IP reputation (MaxMind GeoIP + abuse signals)
- Velocity: applications/hour, profile edits/hour, message rate
- Photo: face detection + reverse image search (detect stock photos, deep fakes)
- Document: Onfido confidence score
- Behavioral: time-to-fill (bots vs humans), tap patterns
- Payment: Stripe Radar built-in

### Automated actions
- Soft block: require additional verification step
- Throttle: rate-limit until trust score rises
- Suspend: account frozen pending admin review
- Ban: hard delete + IP/device block

### Manual workflows (admin)
- "Investigate" queue sorted by fraud_signals.severity
- Linked accounts surfacing (same device, same IP, similar names)
- Re-verification request flow
- Appeals process with mandatory response SLA

---

## 12. Admin / CRM

(Some of this you've started building in `gigi-venue/app/admin/`.)

### Sections
- **Overview**: live stats, growth charts, conversion funnel
- **Venues**: searchable table, detail view with shifts/applicants/payments/reviews
- **Workers**: same; plus verification queue, fraud signals, suspension history
- **Applications**: real-time stream + filters (status, urgency, country)
- **Payments**: invoices, payouts, disputes, refund triggers
- **Messages**: flagged conversations queue
- **CRM**: leads pipeline (cold → demo → onboarded), assigned reps, activity timeline
- **Support tickets**: inbound from app + email
- **Content moderation**: photos/videos awaiting review
- **Documents**: verification queue with Onfido confidence + manual override
- **Compliance**: GDPR requests dashboard, audit log search, breach incidents
- **Feature flags**: toggle features per user/country/cohort
- **Translations**: in-context string editor (writes back to repo via GitHub PR)
- **Marketing**: push campaign builder, email broadcasts, A/B variants

### Permissions
- `admin`: everything
- `support`: read most, write only on tickets + send-message-as-system
- `compliance_officer`: read all PII + audit access; can't change pricing
- `finance`: read payments + payouts; can issue refunds; can't see chat content
- `country_manager`: scoped to country, full admin within their country

---

## 13. Analytics

### Product analytics (PostHog)
Track every meaningful event: `signup_started`, `signup_completed`, `shift_posted`, `application_sent`, `hire_confirmed`, `payment_charged`, `app_opened`, `feature_used:{name}`, etc.

### Marketplace KPIs
- GMV (gross marketplace volume) by country/month
- Take rate (platform_fee / gross)
- Liquidity: time-to-first-application per shift, fill rate, % shifts filled in <1h
- Worker LTV, venue LTV, CAC by channel
- Repeat hire rate (venue hires same worker twice)
- Cohort retention (signup week → app open in week N)

### Operational
- Application → response SLA (median, p95)
- Hire → check-in conversion
- Payment failure rate
- Notification delivery + open rates

---

## 14. Future AI capabilities

- **Resume auto-extraction**: worker uploads CV → AI fills profile fields
- **Video summary**: AI generates 1-line bio from intro video
- **Personality matching**: vector similarity between worker quiz + venue self-description
- **Demand forecasting**: predict which positions a venue will need next week, prompt them
- **Chat assistant for venues**: "Find me 3 baristas for tomorrow, max €15/h, fluent Italian, available 8-12"
- **Worker coach**: "Your intro video tip: smile more, mention Italian fluency in first 5 sec"

---

## 15. Infrastructure & scaling

### Year 1 (< 100k users)
- Supabase Pro ($25/mo) → handles it easily
- Vercel Pro ($20/mo) for admin + landing
- Stripe Connect (revenue-share, no flat fee)
- Twilio + Resend (pay per use)
- Sentry free tier + PostHog free tier

### Year 2 (100k-1M users)
- Supabase Team ($599/mo) or migrate hot tables to dedicated RDS
- Add Upstash Redis for sessions + rate limits
- Move file storage to S3 directly with CloudFront
- Add Inngest for background jobs
- Move search to Typesense or Elasticsearch
- Add read replicas for analytics queries

### Year 3+ (>1M users)
- Multi-region deployment (EU + US + APAC)
- Postgres logical replication for region-local reads
- Dedicated matching service (Go or Rust) with Redis-backed candidate cache
- Vector search via Pinecone or Weaviate
- Data warehouse (Snowflake or BigQuery) for analytics; nightly CDC sync
- Dedicated security team + bug bounty program

---

## 16. Security

- All secrets in environment, never in repo
- Service role keys server-only; never shipped to client
- RLS on every table; default-deny policies
- Stripe webhook signature verification mandatory
- Rate limiting per IP + per user (Redis token bucket)
- CSRF tokens on web admin
- HTTPS only; HSTS preloaded
- CSP headers
- Dependency scanning (Snyk or GitHub Dependabot)
- Penetration test annually starting year 2
- Bug bounty program at year 2

---

## 17. Roadmap — what to ship when

### Already shipped (today)
- ✅ Worker + venue onboarding flows
- ✅ Shift posting (with ASAP urgent flag)
- ✅ Photo + video upload to Supabase Storage
- ✅ Applications table + Decline/Interview/Hire wiring
- ✅ Multi-language support (EN/IT/FR/ES)
- ✅ Admin CRM (lists of venues/workers/applications, drill-downs)

### Milan launch (June 3-5) — MUST HAVE
- 🔴 TestFlight build for iOS (so testers can install)
- 🔴 Privacy Policy + ToS (Iubenda, ~€8/mo)
- 🔴 Phone OTP via Twilio (real auth, not anonymous)
- 🔴 Push notifications via Expo Push (for new applications + hire offers)
- 🔴 QR code generator inside venue app (printable PDF stickers)
- 🔴 Apple Developer account + App Store listing

### First month post-launch (June)
- ⚠️ Stripe Connect onboarding (venues + workers)
- ⚠️ Contracts module (Italian templates, lawyer-reviewed)
- ⚠️ Geofenced check-in/out
- ⚠️ First payment cycle (charge venue → pay worker)
- ⚠️ In-app chat (Supabase Realtime)
- ⚠️ Two-sided ratings
- ⚠️ Real ID verification (Onfido)

### Month 2-3
- ⏳ ML-based matching v1
- ⏳ ASAP urgent flow polished (push override, geofence, first-come-first-serve)
- ⏳ Tax docs auto-generation
- ⏳ Admin: fraud signals queue, content moderation queue
- ⏳ France + Spain expansion (legal templates, language)
- ⏳ Pro tier launch (€49/mo)

### Month 4-6
- 🔮 Worker referral program
- 🔮 Saved searches + alerts
- 🔮 Recurring shift templates
- 🔮 Calendar integrations (Google, Outlook)
- 🔮 WhatsApp Business channel for messaging

### Year 1
- 🚀 AI capabilities (resume extraction, chat assistant)
- 🚀 Background check provider integrations
- 🚀 Insurance partner: per-shift worker coverage offer
- 🚀 Loans / wage advance ("get paid today" against expected payout)

---

## 18. Operational rituals

- Weekly: KPI review, top 5 bugs review, top 5 venue complaints
- Daily: notification delivery dashboard, payment success rate, fraud queue
- Monthly: legal/compliance review (contract template freshness, regulator changes)
- Quarterly: lawyer sign-off on Italy/France/Spain contracts, security audit
- Annually: pen test, GDPR review, full data export drill

---

## End

This blueprint is a north star. The implementation order is dictated by `Section 17 — Roadmap`. Build the marketplace, then the trust layer, then the intelligence layer. Resist the temptation to build everything at once.
