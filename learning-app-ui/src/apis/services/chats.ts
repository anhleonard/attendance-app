import axiosInstance from "../axios";
import { FilterChatDto, UpdateChatDto } from "../dto";

const API_DOMAIN = process.env.NEXT_PUBLIC_HTTP_API_DOMAIN;

export const getChats = async (data: FilterChatDto) => {
  try {
    const response = await axiosInstance.post(`${API_DOMAIN}/chats/find-chats`, data);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || error.message;
  }
};

export const updateChat = async (data: UpdateChatDto) => {
    try {
        const response = await axiosInstance.post(`${API_DOMAIN}/chats/update`, data);
        return response.data;
    } catch (error: any) {
        throw error?.response?.data || error.message;
    }
};