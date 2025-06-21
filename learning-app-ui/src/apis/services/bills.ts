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
  try {
    const response = await axiosInstance.post(`${API_DOMAIN}/bills/generate`, billGenerateDto, {
      responseType: "blob",
    });
    
    // Convert month format from MM/YYYY to MM.YYYY
    const formattedMonth = billGenerateDto.month.replace("/", ".");
    
    // Create filename from data: "Tên học sinh - Tháng.Năm.png"
    const fileName = `${billGenerateDto.studentName} - ${formattedMonth}.png`;
    
    const url = window.URL.createObjectURL(response.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    throw error?.response?.data || error.message;
  }
};

export const downloadAllBills = async (data: DownloadAllBillsDto) => {
  try {
    const response = await axiosInstance.post(`${API_DOMAIN}/bills/download-all`, data, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(response.data);
    return url;
  } catch (error: any) {
    throw error?.response?.data || error.message;
  }
};
