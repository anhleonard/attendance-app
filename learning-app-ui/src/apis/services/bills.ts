import axiosInstance from "../axios";
import { DownloadAllBillsDto } from "../dto";

const API_DOMAIN = process.env.NEXT_PUBLIC_HTTP_API_DOMAIN;

interface BillGenerateDto {
  studentName: string;
  class: string;
  month: string;
  amount: string;
  learningDates: string[];
  sessionCount: string;
  amountPerSession: string;
  totalAmount: string;
}

export const generateBill = async (billGenerateDto: BillGenerateDto) => {
  const response = await axiosInstance.post(`${API_DOMAIN}/bills/generate`, billGenerateDto, {
    responseType: "blob",
  });
  
  const formattedMonth = billGenerateDto.month.replace("/", ".");
  const fileName = `${billGenerateDto.studentName} - ${formattedMonth}.png`;
  
  const url = window.URL.createObjectURL(response.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const downloadAllBills = async (data: DownloadAllBillsDto) => {
  const response = await axiosInstance.post(`${API_DOMAIN}/bills/download-all`, data, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(response.data);
  return url;
};
