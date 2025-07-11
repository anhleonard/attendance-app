import axiosInstance from "../axios";
import { CreateClassDto, FilterCalendarDto, FilterClassDto, UpdateClassDto } from "../dto";

const API_DOMAIN = process.env.NEXT_PUBLIC_HTTP_API_DOMAIN;

export const createClass = async (data: CreateClassDto) => {
  const response = await axiosInstance.post(`${API_DOMAIN}/classes/create`, data);
  return response.data;
};

export const getClasses = async (data?: FilterClassDto) => {
  const response = await axiosInstance.post(`${API_DOMAIN}/classes/find-classes`, data);
  return response.data;
};

export const updateClass = async (data: UpdateClassDto) => {
  const response = await axiosInstance.post(`${API_DOMAIN}/classes/update`, data);
  return response.data;
};

export const getCalendar = async (data?: FilterCalendarDto) => {
  const response = await axiosInstance.post(`${API_DOMAIN}/classes/calendar`, data);
  return response.data;
};
