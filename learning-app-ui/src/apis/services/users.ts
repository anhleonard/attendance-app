import axiosInstance from "../axios";
import { FilterUsersDto, UpdateUserDto } from "../dto";

export const getUserInfo = async () => {
  const response = await axiosInstance.post("/users/profile");
  return response.data;
};

export const getSystemUsers = async (filterUsersDto: FilterUsersDto) => {
  const response = await axiosInstance.post("/users/find-users", filterUsersDto);
  return response.data;
};

export const updateUser = async (updateUserDto: UpdateUserDto, avatarFile?: File) => {
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
    const response = await axiosInstance.post("/users/update", updateUserDto);
    return response.data;
  }
};
