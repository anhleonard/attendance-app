import { SessionKey } from "@/config/enums";

export function formatCurrency(amount: number) {
  return amount.toLocaleString("vi-VN");
}

export const getDayBySessionKey = (sessionKey: SessionKey): string => {
  const sessionKeys = [
    SessionKey.SESSION_7, // Chủ nhật (0)
    SessionKey.SESSION_1, // Thứ 2 (1)
    SessionKey.SESSION_2, // Thứ 3 (2)
    SessionKey.SESSION_3, // Thứ 4 (3)
    SessionKey.SESSION_4, // Thứ 5 (4)
    SessionKey.SESSION_5, // Thứ 6 (5)
    SessionKey.SESSION_6, // Thứ 7 (6)
  ];

  const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const index = sessionKeys.indexOf(sessionKey);
  return days[index];
};

export const getSessionKeyByDay = (day: string): SessionKey => {
  const sessionKeys = [
    SessionKey.SESSION_7, // Chủ nhật (0)
    SessionKey.SESSION_1, // Thứ 2 (1)
    SessionKey.SESSION_2, // Thứ 3 (2)
    SessionKey.SESSION_3, // Thứ 4 (3)
    SessionKey.SESSION_4, // Thứ 5 (4)
    SessionKey.SESSION_5, // Thứ 6 (5)
    SessionKey.SESSION_6, // Thứ 7 (6)
  ];

  const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const index = days.indexOf(day);
  return sessionKeys[index];
};
