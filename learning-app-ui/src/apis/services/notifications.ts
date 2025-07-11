import axiosInstance from "../axios";
import { CreateNotificationDto, FilterNotificationDto, UpdateNotificationDto } from "../dto";

const API_DOMAIN = process.env.NEXT_PUBLIC_HTTP_API_DOMAIN;

export const getNotifications = async (data: FilterNotificationDto) => {
  const response = await axiosInstance.post(`${API_DOMAIN}/notifications/find-notifications`, data);
  return response.data;
};

export const updateNotification = async (data: UpdateNotificationDto) => {
  const response = await axiosInstance.post(`${API_DOMAIN}/notifications/update`, data);
  return response.data;
};

export const createNotification = async (data: CreateNotificationDto) => {
  const response = await axiosInstance.post(`${API_DOMAIN}/notifications/create`, data);
  return response.data;
};
