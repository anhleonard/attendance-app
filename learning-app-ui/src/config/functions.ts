import { SessionKey } from "@/config/enums";
import { SESSION_KEYS } from "./constants";

export function formatCurrency(amount: number) {
  return amount.toLocaleString("vi-VN");
}

export const getDayBySessionKey = (sessionKey: SessionKey): string => {
  const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
  const index = SESSION_KEYS.indexOf(sessionKey);
  return days[index];
};

export const getSessionKeyByDay = (day: string): SessionKey => {
  const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
  const index = days.indexOf(day);
  return SESSION_KEYS[index];
};

export const maskPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber || phoneNumber.length < 4) {
    return phoneNumber;
  }
  
  const firstTwo = phoneNumber.slice(0, 2);
  const lastTwo = phoneNumber.slice(-2);
  const middleLength = phoneNumber.length - 4;
  const asterisks = '*'.repeat(middleLength);
  
  return `${firstTwo}${asterisks}${lastTwo}`;
};
