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

export const updateUser = async (updateUserDto: UpdateUserDto, avatarFile?: File) => {
  try {
    if (avatarFile) {
      const formData = new FormData();
      formData.append("avatar", avatarFile);
      formData.append("id", updateUserDto.id.toString());
      if (updateUserDto.fullname) {
        formData.append("fullname", updateUserDto.fullname);
      }

      const response = await axiosInstance.post("/users/update", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } else {
      // Send the entire updateUserDto when no avatar
      const response = await axiosInstance.post("/users/update", updateUserDto);
      return response.data;
    }
  } catch (error: any) {
    throw error?.response?.data || error.message;
  }
};
