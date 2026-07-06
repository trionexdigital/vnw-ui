/** Formats a number as Indian Rupees, e.g. 24999 -> ₹24,999 */
export const formatINR = (value: number | string | null | undefined): string => {
  const n = Number(value || 0);
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

export interface BadgeMeta { label: string; className: string; }

/** Maps a number's badge enum to a label + solid colour chip (matches the design). */
export const BADGE_META: Record<string, BadgeMeta> = {
  HOT_PICK: { label: 'Hot Pick', className: 'bg-[#c0392b] text-white' },
  PREMIUM: { label: 'Premium', className: 'bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-[#2a1500]' },
  BEST_SELLER: { label: 'Best Seller', className: 'bg-[#c0392b] text-white' },
  HOT_DEAL: { label: 'Hot Deal', className: 'bg-[#e07b00] text-white' },
  NEW_ARRIVAL: { label: 'New Arrival', className: 'bg-[#1e9e57] text-white' },
  VALUE_PICK: { label: 'Popular', className: 'bg-[#6c3bb5] text-white' },
  NONE: { label: '', className: '' },
};

export const badgeOptions = [
  { value: 'NONE', label: 'None' },
  { value: 'HOT_PICK', label: 'Hot Pick' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'BEST_SELLER', label: 'Best Seller' },
  { value: 'HOT_DEAL', label: 'Hot Deal' },
  { value: 'NEW_ARRIVAL', label: 'New Arrival' },
  { value: 'VALUE_PICK', label: 'Popular' },
];

export const operatorOptions = ['Airtel', 'Jio', 'Vi', 'BSNL', 'Other'];

export const statusOptions = ['AVAILABLE', 'RESERVED', 'SOLD', 'PENDING_APPROVAL', 'REJECTED', 'INACTIVE'];

const digits = (s: string) => (s || '').replace(/\D/g, '');

/** Raw sum of all digits, e.g. "9193 999 999" -> 76 (shown as TOTAL). */
export const digitTotal = (numStr: string): number =>
  digits(numStr).split('').reduce((s, d) => s + Number(d), 0);

/** Single-digit numerology root (shown as SUM). */
export const numerologySum = (numStr: string): number => {
  let sum = digitTotal(numStr);
  while (sum > 9) sum = String(sum).split('').reduce((s, d) => s + Number(d), 0);
  return sum;
};
