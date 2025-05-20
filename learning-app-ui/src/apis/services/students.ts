import axiosInstance from "../axios";
import { CreateStudentDto, FilterStudentDto, UpdateStudentDto } from "../dto";
import { Status } from "@/config/enums";

const API_DOMAIN = process.env.NEXT_PUBLIC_HTTP_API_DOMAIN;

export const createStudent = async (data: CreateStudentDto) => {
  try {
    const response = await axiosInstance.post(`${API_DOMAIN}/students/create`, data);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || error.message;
  }
};

export const getStudents = async (data?: FilterStudentDto) => {
  try {
    const response = await axiosInstance.post(`${API_DOMAIN}/students/find-students`, data);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || error.message;
  }
};

export const updateStudent = async (data: UpdateStudentDto) => {
  try {
    const response = await axiosInstance.post(`${API_DOMAIN}/students/update`, data);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || error.message;
  }
};
