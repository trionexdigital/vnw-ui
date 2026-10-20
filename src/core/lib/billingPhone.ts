// Match the existing payment gateway requirement before creating a reservation.
export function hasBillingPhone(value?: string | null) {
  const phone = String(value || '').replace(/[^0-9]/g, '').replace(/^91(?=\d{10}$)/, '');
  return /^[6-9]\d{9}$/.test(phone);
}
