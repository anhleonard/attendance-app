import axios from "axios";

const API_DOMAIN = process.env.NEXT_PUBLIC_HTTP_API_DOMAIN;

console.log("🔧 API_DOMAIN:", API_DOMAIN);
console.log("🔧 NEXT_PUBLIC_HTTP_API_DOMAIN:", process.env.NEXT_PUBLIC_HTTP_API_DOMAIN);
console.log("🔧 Environment check:", {
  API_DOMAIN: API_DOMAIN,
  FULL_URL: API_DOMAIN + '/auth/login'
});

const axiosInstance = axios.create({
  baseURL: API_DOMAIN,
  withCredentials: true,
});

// Request interceptor để log request
axiosInstance.interceptors.request.use(
  (config) => {
    const fullUrl = (config.baseURL || '') + (config.url || '');
    console.log("🚀 Frontend making request to:", fullUrl);
    console.log("📋 Request method:", config.method?.toUpperCase());
    console.log("📦 Request data:", config.data);
    console.log("🔧 Config baseURL:", config.baseURL);
    console.log("🔧 Config url:", config.url);
    console.log("🔧 Full URL:", fullUrl);
    return config;
  },
  (error) => {
    console.log("❌ Request error:", error);
    return Promise.reject(error);
  }
);

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
