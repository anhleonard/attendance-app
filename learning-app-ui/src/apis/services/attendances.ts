import axiosInstance from "../axios";
import { 
  FilterAttendanceDto, 
  UpdateBatchAttendanceDto,
  CreateBatchAttendanceDto,
} from "../dto";

const API_DOMAIN = process.env.NEXT_PUBLIC_HTTP_API_DOMAIN;

export const createBatchAttendance = async (data: CreateBatchAttendanceDto) => {
  const response = await axiosInstance.post(`${API_DOMAIN}/attendances/create-batch`, data);
  return response.data;
};

export const getAttendances = async (data: FilterAttendanceDto) => {
  const response = await axiosInstance.post(`${API_DOMAIN}/attendances/find-attendances`, data);
  return response.data;
};

export const updateBatchAttendance = async (data: UpdateBatchAttendanceDto) => {
  const response = await axiosInstance.post(`${API_DOMAIN}/attendances/update-batch`, data);
  return response.data;
};
