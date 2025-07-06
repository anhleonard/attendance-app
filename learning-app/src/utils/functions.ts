import { randomBytes } from 'crypto';

export function generateRandomPassword(length = 12) {
  return randomBytes(length)
    .toString('base64')
    .slice(0, length)
    .replace(/[+/=]/g, 'X'); // loại bỏ ký tự dễ gây nhầm lẫn
}

export function formatCurrency(amount: number) {
  return amount.toLocaleString("vi-VN");
}
