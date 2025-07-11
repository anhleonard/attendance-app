import axiosInstance from "../axios";
import { FilterMessageDto, UpdateMessageDto } from "../dto";

const API_DOMAIN = process.env.NEXT_PUBLIC_HTTP_API_DOMAIN;

export const getMessages = async (data: FilterMessageDto) => {
  const response = await axiosInstance.post(`${API_DOMAIN}/messages/find-messages`, data);
  return response.data;
};

export const updateMessage = async (data: UpdateMessageDto) => {
  const response = await axiosInstance.post(`${API_DOMAIN}/messages/update`, data);
  return response.data;
};