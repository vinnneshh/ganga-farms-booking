import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toWords } from "number-to-words";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function amountToWords(amount: number) {
  try {
    const words = toWords(amount);
    return words.charAt(0).toUpperCase() + words.slice(1) + " only";
  } catch (e) {
    return "";
  }
}
