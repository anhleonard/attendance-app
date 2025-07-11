import axiosInstance from "../axios";
import { FilterChatDto, UpdateChatDto } from "../dto";

const API_DOMAIN = process.env.NEXT_PUBLIC_HTTP_API_DOMAIN;

export const getChats = async (data: FilterChatDto) => {
  const response = await axiosInstance.post(`${API_DOMAIN}/chats/find-chats`, data);
  return response.data;
};

export const updateChat = async (data: UpdateChatDto) => {
  const response = await axiosInstance.post(`${API_DOMAIN}/chats/update`, data);
  return response.data;
};