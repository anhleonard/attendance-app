import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import Image from "next/image";

const Loading = () => {
  const isLoading = useSelector((state: RootState) => state.loading.isOpen);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 flex items-center justify-center h-screen w-screen z-[9999] bg-white/50">
      <Image src="/icons/loading.svg" alt="loading" width={36} height={36} className="animate-spin" />
    </div>
  );
};

export default Loading;
