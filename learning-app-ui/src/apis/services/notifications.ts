import axiosInstance from "../axios";
import { CreateNotificationDto, FilterNotificationsDto, UpdateNotificationDto } from "../dto";

const API_DOMAIN = process.env.NEXT_PUBLIC_HTTP_API_DOMAIN;

export const getNotifications = async (data: FilterNotificationsDto) => {
  try {
    const response = await axiosInstance.post(`${API_DOMAIN}/notifications/find-notifications`, data);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || error.message;
  }
};

export const updateNotification = async (data: UpdateNotificationDto) => {
  try {
    const response = await axiosInstance.post(`${API_DOMAIN}/notifications/update`, data);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || error.message;
  }
};

export const createNotification = async (data: CreateNotificationDto) => {
  try {
    const response = await axiosInstance.post(`${API_DOMAIN}/notifications/create`, data);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || error.message;
  }
};
