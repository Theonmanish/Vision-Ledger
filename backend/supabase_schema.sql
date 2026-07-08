-- VisionLedger live Supabase schema (existing production table)

create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  claim_type text not null,
  description text,
  image_url text,
  status text not null default 'Pending',
  confidence integer not null default 0,
  reason text,
  image_hash text,
  report_hash text,
  tx_hash text,
  created_at timestamptz not null default now(),
  claim_input jsonb
);

create index if not exists claims_created_at_idx on public.claims (created_at desc);

-- Extended AI fields are stored in claim_input JSON:
-- {
--   "claim_code": "CLM-XXXXXX",
--   "claim_supported": true,
--   "objects_detected": ["object1"],
--   "estimated_quantity": 200,
--   "limitations": "...",
--   "recommendation": "..."
-- }

-- Storage: create a public bucket named "evidence" in Supabase Storage.
