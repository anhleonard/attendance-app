import axiosInstance from "../axios";
import { CreateAttendanceDto, FilterAttendanceDto, UpdateBatchAttendanceDto } from "../dto";

const API_DOMAIN = process.env.NEXT_PUBLIC_HTTP_API_DOMAIN;

export const createBatchAttendance = async (data: CreateAttendanceDto[]) => {
  try {
    const response = await axiosInstance.post(`${API_DOMAIN}/attendances/create-batch`, data);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || error.message;
  }
};

export const getAttendances = async (data: FilterAttendanceDto) => {
  try {
    const response = await axiosInstance.post(`${API_DOMAIN}/attendances/find-attendances`, data);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || error.message;
  }
};

export const updateBatchAttendance = async (data: UpdateBatchAttendanceDto) => {
  try {
    const response = await axiosInstance.post(`${API_DOMAIN}/attendances/update-batch`, data);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || error.message;
  }
};
