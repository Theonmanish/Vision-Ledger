-- Migration 001: blockchain anchoring columns for the claims table.
--
-- Adds durable storage for the on-chain proof produced by
-- VisionLedgerVerifier on Ethereum Sepolia. Safe to run repeatedly
-- (idempotent guards). The existing tx_hash column is repurposed to
-- hold the real on-chain transaction hash; the placeholder semantics
-- are retired once this migration is applied.

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

-- Backfill the legacy tx_hash column into transaction_hash for any
-- pre-existing rows so historical placeholder values are preserved.
update public.claims
   set transaction_hash = coalesce(transaction_hash, tx_hash)
 where transaction_hash is null and tx_hash is not null;

-- Index the verification hash for O(log n) provenance lookups.
create index if not exists claims_blockchain_hash_idx
    on public.claims (blockchain_hash);

create index if not exists claims_transaction_hash_idx
    on public.claims (transaction_hash);
