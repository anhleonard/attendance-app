import axiosInstance from "../axios";
import { CreateStudentDto, FilterStudentDto, ImportFileStudentDto, UpdateStudentDto } from "../dto";

const API_DOMAIN = process.env.NEXT_PUBLIC_HTTP_API_DOMAIN;

export const createStudent = async (data: CreateStudentDto) => {
  const response = await axiosInstance.post(`${API_DOMAIN}/students/create`, data);
  return response.data?.createdStudent;
};

export const getStudents = async (data?: FilterStudentDto) => {
  const response = await axiosInstance.post(`${API_DOMAIN}/students/find-students`, data);
  return response.data;
};

export const updateStudent = async (data: UpdateStudentDto) => {
  const response = await axiosInstance.post(`${API_DOMAIN}/students/update`, data);
  return response.data;
};

export const importFileStudent = async (data: ImportFileStudentDto) => {
  const formData = new FormData();
  formData.append("classId", data.classId.toString());
  formData.append("file", data.file);

  const response = await axiosInstance.post(`${API_DOMAIN}/students/import-file-student`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};
