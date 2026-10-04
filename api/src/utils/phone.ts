export function sanitizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
}