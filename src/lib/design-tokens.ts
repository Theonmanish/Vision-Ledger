/** Design tokens extracted from the Hero — single source of truth for the app UI. */
export const tokens = {
  bg: '#09090B',
  card: '#111113',
  primary: '#2563EB',
  accent: '#3B82F6',
  success: '#22C55E',
  border: 'rgba(255,255,255,0.08)',
} as const;

export const ds = {
  page: 'bg-[#09090B] text-white',
  container: 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8',
  section: 'py-20 sm:py-28',
  glassCard:
    'relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#111113]/80 backdrop-blur-xl transition-all duration-300',
  glassCardHover:
    'hover:border-[#3B82F6]/30 hover:shadow-[0_0_30px_rgba(37,99,235,0.12)]',
  glassPanel:
    'relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111113]/60 backdrop-blur-2xl',
  iconBox: 'flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB]/15 text-[#3B82F6]',
  iconBoxLg: 'flex h-12 w-12 items-center justify-center rounded-xl bg-[#2563EB]/15 text-[#3B82F6]',
  badge:
    'inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm',
  badgeSuccess: 'rounded-full bg-[#22C55E]/15 px-2.5 py-0.5 text-[10px] font-medium text-[#22C55E]',
  heading1: 'text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-white',
  heading2: 'text-3xl sm:text-4xl font-bold tracking-tight text-white',
  heading3: 'text-lg font-semibold text-white',
  body: 'text-base text-white/60 sm:text-lg leading-relaxed',
  bodySm: 'text-sm text-white/50 leading-relaxed',
  label: 'text-sm font-medium text-white/80',
  divider: 'border-white/[0.08]',
  input:
    'flex w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/40 backdrop-blur-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 focus-visible:border-[#2563EB]/40',
  btnPrimary:
    'inline-flex h-12 items-center justify-center rounded-full bg-[#2563EB] px-8 text-base font-medium text-white transition-colors hover:bg-[#3B82F6]',
  btnSecondary:
    'inline-flex h-12 items-center justify-center rounded-full border border-white/[0.08] px-8 text-base font-medium text-white transition-colors hover:bg-white/10',
  btnGhost:
    'inline-flex items-center justify-center rounded-full text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white',
} as const;
