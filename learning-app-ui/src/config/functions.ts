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
