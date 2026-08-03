export type NumberPurchaseMode = 'BUY' | 'PREBOOK' | 'UNAVAILABLE';

export function getNumberPurchaseMode(number: { status?: string; stock?: number; rtp_status?: string }): NumberPurchaseMode {
  if (number.status && number.status !== 'AVAILABLE') return 'UNAVAILABLE';
  if (number.stock !== undefined && Number(number.stock) <= 0) return 'UNAVAILABLE';
  return number.rtp_status === 'NON_RTP' ? 'PREBOOK' : 'BUY';
}

export function numberActionPath(number: { number_id: number; status?: string; stock?: number; rtp_status?: string }) {
  return getNumberPurchaseMode(number) === 'PREBOOK'
    ? `/pre-book/${number.number_id}/checkout`
    : `/checkout?number_id=${number.number_id}`;
}

export function formatRtpDate(value?: string | null) {
  if (!value) return 'Date to be confirmed';
  const parsed = new Date(String(value).replace(' ', 'T') + (String(value).includes('Z') ? '' : 'Z'));
  if (Number.isNaN(parsed.getTime())) return String(value).slice(0, 10);
  return new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' }).format(parsed);
}
