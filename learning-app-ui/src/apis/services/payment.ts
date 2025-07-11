import axiosInstance from "../axios";
import { FilterPaymentDto, UpdateBatchPaymentsDto, UpdatePaymentDto } from "../dto";

const API_DOMAIN = process.env.NEXT_PUBLIC_HTTP_API_DOMAIN;

export const getPayments = async (data: FilterPaymentDto) => {
  const response = await axiosInstance.post(`${API_DOMAIN}/payments/find-payments`, data);
  return response.data;
};

export const updatePayment = async (data: UpdatePaymentDto) => {
  const response = await axiosInstance.post(`${API_DOMAIN}/payments/update`, data);
  return response.data;
};

export const updateBatchPayments = async (data: UpdateBatchPaymentsDto) => {
  const response = await axiosInstance.post(`${API_DOMAIN}/payments/update-batch`, data);
  return response.data;
};
