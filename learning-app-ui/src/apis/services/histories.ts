import axiosInstance from "../axios";
import { FilterHistoryDto } from "../dto";

const API_DOMAIN = process.env.NEXT_PUBLIC_HTTP_API_DOMAIN;

export const getHistories = async (data: FilterHistoryDto) => {
  try {
    const response = await axiosInstance.post(`${API_DOMAIN}/histories/find-histories`, data);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || error.message;
  }
};