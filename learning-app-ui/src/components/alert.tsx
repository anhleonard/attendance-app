import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useEffect, useRef } from "react";
import { closeAlert } from "@/redux/slices/alert-slice";

const alertConfig = {
  success: {
    bgColor: "bg-[#e0f7e7]",
    textColor: "text-[#318258]",
    icon: "/icons/success-icon.svg",
  },
  error: {
    bgColor: "bg-[#FFE0E7]",
    textColor: "text-[#BA4059]",
    icon: "/icons/error-icon.svg",
  },
  warning: {
    bgColor: "bg-[#fff4e5]",
    textColor: "text-[#ed8936]",
    icon: "/icons/warning-icon.svg",
  },
  info: {
    bgColor: "bg-[#DCF2FF]",
    textColor: "text-[#1495fd]",
    icon: "/icons/info-icon.svg",
  },
} as const;

export function Alert() {
  const dispatch = useDispatch();
  const { isOpen, title, subtitle, type } = useSelector((state: RootState) => state.alert);
  const alertRef = useRef<HTMLDivElement>(null);

  const handleCloseAlert = () => {
    dispatch(closeAlert());
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (alertRef.current && !alertRef.current.contains(event.target as Node)) {
        handleCloseAlert();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const config = type ? alertConfig[type] : alertConfig.success;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={alertRef}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ duration: 0.2 }}
          className={`fixed top-4 right-4 w-80 md:w-96 rounded-xl ${config.bgColor} z-[2999]`}
        >
          <div className="w-full h-full relative">
            <div className="flex items-start gap-6 justify-center w-fit pl-6 pr-12 py-4">
              <Image src={config.icon} alt={`${type}-icon`} width={28} height={28} className="mt-[2px]" />
              <div className="text-sm flex flex-col gap-1 items-start">
                <div className={`font-bold text-[15px] ${config.textColor}`}>{title}</div>
                <div className="text-black/80 text-[13px] font-medium">{subtitle}</div>
              </div>
            </div>
          </div>
          <button
            onClick={handleCloseAlert}
            className="absolute top-2 right-4 hover:opacity-50 active:opacity-70 duration-300 transition-all w-5 h-5"
          >
            <Image src="/icons/exit-icon.svg" alt="exit-icon" width={16} height={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
