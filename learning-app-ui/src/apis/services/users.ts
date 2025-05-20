import axiosInstance from "../axios";

export const getUserInfo = async () => {
  try {
    const response = await axiosInstance.post("/users/profile");
    return response.data;
  } catch (error: any) {
    throw error?.response?.data || error.message;
  }
};
