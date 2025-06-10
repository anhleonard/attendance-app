import { randomBytes } from 'crypto';
import { SortType } from './enums';

export function generateRandomPassword(length = 12) {
  return randomBytes(length)
    .toString('base64')
    .slice(0, length)
    .replace(/[+/=]/g, 'X'); // loại bỏ ký tự dễ gây nhầm lẫn
}

// Kiểu dữ liệu chung (có field 'name')
interface NamedItem {
  name: string;
}

// Tách từ
function splitWords(fullNameRaw: string | undefined | null): string[] {
  if (!fullNameRaw) return [];
  return fullNameRaw.trim().replace(/\s+/g, ' ').split(' ');
}

// Hàm so sánh 2 tên kiểu Việt Nam
function compareVietnameseNames<T extends NamedItem>(
  a: T,
  b: T,
  order: SortType,
): number {
  const wordsA = splitWords(a.name);
  const wordsB = splitWords(b.name);

  const lenA = wordsA.length;
  const lenB = wordsB.length;
  const minLen = Math.min(lenA, lenB);

  // So từ cuối về đầu
  for (let i = 1; i <= minLen; i++) {
    const compare = wordsA[lenA - i].localeCompare(wordsB[lenB - i], 'vi-VN');
    if (compare !== 0) {
      return order === 'asc' ? compare : -compare;
    }
  }

  // Nếu toàn bộ từ giống nhau → tên ngắn hơn đứng trước
  const lengthCompare = lenA - lenB;
  return order === 'asc' ? lengthCompare : -lengthCompare;
}

// Hàm sort chung cho mảng data, có param asc/desc
export function sortVietnameseNames<T extends NamedItem>(
  data: T[],
  order: SortType = SortType.ASC,
): T[] {
  return data.sort((a, b) => compareVietnameseNames(a, b, order));
}
