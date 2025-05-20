import axios from "axios";

const API_DOMAIN = process.env.NEXT_PUBLIC_HTTP_API_DOMAIN;

const axiosInstance = axios.create({
  baseURL: API_DOMAIN,
  withCredentials: true,
});

export default axiosInstance;
