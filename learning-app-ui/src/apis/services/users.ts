import axiosInstance from "../axios";
import { FilterUsersDto, UpdateUserDto } from "../dto";

export const getUserInfo = async () => {
  try {
    const response = await axiosInstance.post("/users/profile");
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || error.message;
  }
};

export const getSystemUsers = async (filterUsersDto: FilterUsersDto) => {
  try {
    const response = await axiosInstance.post("/users/find-users", filterUsersDto);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || error.message;
  }
};

export const updateUser = async (updateUserDto: UpdateUserDto) => {
  try {
    const response = await axiosInstance.post("/users/update", updateUserDto);
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || error.message;
  }
};
