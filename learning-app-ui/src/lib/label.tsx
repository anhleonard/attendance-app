import React from "react";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  status?: "success" | "error" | "info" | "warning" | "progress";
  label: string;
}

const Label: React.FC<Props> = ({ status = "info", label, className, ...props }) => {
  const baseClass = "rounded-full py-1.5 px-3 text-center font-bold";

  const statusClass = {
    success: "bg-success-c100 text-success-c700",
    error: "bg-red-100 text-support-c800",
    info: "bg-primary-c100 text-primary-c900",
    warning: "bg-[#FFE8C7] text-[#FE9800]",
    progress: "bg-[#f8dce4] text-[#ab2c52]",
  }[status];

  // Hàm để kết hợp các lớp CSS
  const combineClasses = (...classes: (string | undefined | null | false)[]) => {
    return classes.filter(Boolean).join(" ");
  };

  return (
    <div className={combineClasses(baseClass, statusClass, className)} {...props}>
      {label}
    </div>
  );
};

export default Label;
