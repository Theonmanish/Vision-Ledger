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
--   "blockchain": {
--     "verification_hash": "0x...",
--     "transaction_hash": "0x...",
--     "block_number": 12345,
--     "contract_address": "0x...",
--     "network": "Ethereum Sepolia",
--     "anchor_time": "2026-07-10T...",
--     "explorer_url": "https://sepolia.etherscan.io/tx/...",
--     "status": "Confirmed"
--   }
-- }

-- ── Blockchain anchoring columns (migration 001) ───────────────
alter table public.claims
  add column if not exists blockchain_hash text;

alter table public.claims
  add column if not exists transaction_hash text;

alter table public.claims
  add column if not exists block_number bigint;

alter table public.claims
  add column if not exists network text;

alter table public.claims
  add column if not exists verification_anchor_time timestamptz;

alter table public.claims
  add column if not exists blockchain_status text not null default 'Pending';

create index if not exists claims_blockchain_hash_idx
    on public.claims (blockchain_hash);

create index if not exists claims_transaction_hash_idx
    on public.claims (transaction_hash);

-- Storage: create a public bucket named "evidence" in Supabase Storage.
