import axios from "axios";

const API_DOMAIN = process.env.NEXT_PUBLIC_HTTP_API_DOMAIN;

const axiosInstance = axios.create({
  baseURL: API_DOMAIN,
  withCredentials: true,
});

// Global error handler function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let globalErrorHandler: ((error: any) => void) | null = null;

// Function để set error handler từ component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const setGlobalErrorHandler = (handler: (error: any) => void) => {
  globalErrorHandler = handler;
};

// Response interceptor để tự động xử lý lỗi
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.log("Axios interceptor caught error:", error);
    console.log("Global error handler exists:", !!globalErrorHandler);
    
    // Tự động hiển thị alert cho lỗi nếu có handler
    if (globalErrorHandler) {
      const errorMessage = error.response?.data?.message || error.message || "Something went wrong. Please try again.";
      console.log("Dispatching error alert:", errorMessage);
      globalErrorHandler({
        title: "ERROR",
        subtitle: errorMessage,
        type: "error",
      });
    }
    
    return Promise.reject(error);
  }
);

// Cách sử dụng:
// 1. Import hook trong component: import { useGlobalErrorHandler } from "@/hooks/useGlobalErrorHandler";
// 2. Gọi hook: useGlobalErrorHandler();
// 3. Bây giờ tất cả API calls sẽ tự động hiển thị alert khi có lỗi
// 4. Không cần viết try-catch với dispatch alert nữa!

export default axiosInstance;
