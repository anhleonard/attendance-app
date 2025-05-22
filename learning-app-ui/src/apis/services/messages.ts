import axiosInstance from "../axios";
import { FilterMessageDto, UpdateMessageDto } from "../dto";

const API_DOMAIN = process.env.NEXT_PUBLIC_HTTP_API_DOMAIN;

export const getMessages = async (data: FilterMessageDto) => {
  try {
    const response = await axiosInstance.post(`${API_DOMAIN}/messages/find-messages`, data);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || error.message;
  }
};

export const updateMessage = async (data: UpdateMessageDto) => {
  try {
    const response = await axiosInstance.post(`${API_DOMAIN}/messages/update`, data);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || error.message;
  }
};