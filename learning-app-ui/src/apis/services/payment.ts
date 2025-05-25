import axiosInstance from "../axios";
import { FilterPaymentDto } from "../dto";

const API_DOMAIN = process.env.NEXT_PUBLIC_HTTP_API_DOMAIN;

export const getPayments = async (data: FilterPaymentDto) => {
  try {
    const response = await axiosInstance.post(`${API_DOMAIN}/payments/find-payments`, data);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || error.message;
  }
};