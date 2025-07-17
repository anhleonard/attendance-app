import { ChangePasswordDto, ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from "../dto";
import axiosInstance from "../axios";

const API_DOMAIN = process.env.NEXT_PUBLIC_HTTP_API_DOMAIN;

export const login = async (data: LoginDto) => {
  console.log(`${API_DOMAIN}/auth/login`, 'tesssssssssssssssss');
  const response = await axiosInstance.post(`${API_DOMAIN}/auth/login`, data);
  return response.data;
};

export const register = async (data: RegisterDto) => {
  const response = await axiosInstance.post(`${API_DOMAIN}/users/create`, data);
  return response.data;
};

export const changePassword = async (data: ChangePasswordDto) => {
  const response = await axiosInstance.post(`${API_DOMAIN}/auth/change-password`, data);
  return response.data;
};

export const forgotPassword = async (data: ForgotPasswordDto) => {
  const response = await axiosInstance.post(`${API_DOMAIN}/auth/forgot-password`, data);
  return response.data;
};

export const resetPassword = async (data: ResetPasswordDto) => {
  const response = await axiosInstance.post(`${API_DOMAIN}/auth/reset-password`, data);
  return response.data;
};
