import axiosInstance from "../axios";
import { CreateClassDto, FilterCalendarDto, FilterClassDto, UpdateClassDto } from "../dto";

const API_DOMAIN = process.env.NEXT_PUBLIC_HTTP_API_DOMAIN;

export const createClass = async (data: CreateClassDto) => {
  try {
    const response = await axiosInstance.post(`${API_DOMAIN}/classes/create`, data);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || error.message;
  }
};

// filter classes by options
export const getClasses = async (data?: FilterClassDto) => {
  try {
    const response = await axiosInstance.post(`${API_DOMAIN}/classes/find-classes`, data);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || error.message;
  }
};

export const updateClass = async (data: UpdateClassDto) => {
  try {
    const response = await axiosInstance.post(`${API_DOMAIN}/classes/update`, data);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || error.message;
  }
};

// get calendar by month and year
export const getCalendar = async (data?: FilterCalendarDto) => {
  try {
    const response = await axiosInstance.post(`${API_DOMAIN}/classes/calendar`, data);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || error.message;
  }
};
