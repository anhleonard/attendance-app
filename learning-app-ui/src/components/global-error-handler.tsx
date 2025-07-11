"use client";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { openAlert } from "@/redux/slices/alert-slice";
import { setGlobalErrorHandler } from "@/apis/axios";

export const GlobalErrorHandler = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Set up global error handler
    setGlobalErrorHandler((errorData) => {
      dispatch(openAlert({
        isOpen: true,
        ...errorData,
      }));
    });

    // Cleanup khi component unmount
    return () => {
      setGlobalErrorHandler(() => {});
    };
  }, [dispatch]);

  // Component này không render gì cả, chỉ setup error handler
  return null;
}; 