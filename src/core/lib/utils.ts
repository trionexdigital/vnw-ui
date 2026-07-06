import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Masks a phone number to show only the first and last two digits. */
export const maskPhone = (phone: string | null | undefined): string => {
  if (!phone || phone === "N/A") return "N/A";
  const cleaned = phone.toString().trim();
  if (cleaned.length < 4) return cleaned;
  return cleaned.replace(/(\d{2})\d+(\d{2})/, "$1******$2");
};

/** Masks an email address while preserving length. */
export const maskEmail = (email: string | null | undefined): string => {
  if (!email || email === "N/A") return "N/A";
  const [username, domain] = email.split("@");
  if (!domain) return email;
  if (username.length <= 3) return `${username}@${domain}`;
  return `${username.substring(0, 3)}${"*".repeat(username.length - 3)}@${domain}`;
};
