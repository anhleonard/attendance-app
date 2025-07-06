import { useEffect } from "react";
import axiosInstance from "@/apis/axios";

export const useAuthClear = () => {
  useEffect(() => {
    // Clear tất cả auth data
    axiosInstance.defaults.headers.common["Authorization"] = null;
    delete axiosInstance.defaults.headers.common["Authorization"];

    localStorage.clear();
    sessionStorage.clear();

    // Clear cookies
    document.cookie = "Authentication=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  }, []);
};
