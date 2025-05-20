import React, { FC } from "react";

interface Props {
  label?: string;
  status?: "primary" | "secondary" | "warning" | "error" | "info" | "success" | "cancel";
  className?: string;
  wrapClassName?: string;
  onClick?: React.MouseEventHandler;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

const Button: FC<Props> = ({
  label = "Login",
  status = "primary",
  className = "",
  onClick,
  startIcon,
  endIcon,
  wrapClassName = "",
  type = "button",
  disabled = false,
}) => {
  return (
    <div className={`flex flex-col gap-2 ${wrapClassName}`} onClick={onClick}>
      {status === "primary" ? (
        <button
          type={type}
          disabled={disabled}
          className={`flex items-center justify-center gap-1 bg-primary-c900 w-fit px-4 py-1.5 rounded-full cursor-pointer hover:bg-primary-c700 active:bg-primary-c800 hover:scale-105 duration-300 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${className}`}
        >
          {startIcon && <div className="flex items-center">{startIcon}</div>}
          <div className="text-center font-medium text-sm text-white">{label}</div>
          {endIcon && <div className="flex items-center">{endIcon}</div>}
        </button>
      ) : null}

      {status === "secondary" ? (
        <button
          type={type}
          disabled={disabled}
          className={`text-center border-[1px] border-primary-c900 font-normal text-sm bg-white w-fit px-4 py-1.5 text-grey-c900 hover:text-primary-c900 active:text-primary-c900 rounded-full hover:cursor-pointer hover:bg-primary-c50 hover:border-primary-c100 active:bg-primary-c100 active:border-primary-c100 hover:scale-105 duration-300 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${className}`}
        >
          {label}
        </button>
      ) : null}

      {status === "success" ? (
        <button
          type={type}
          disabled={disabled}
          className={`flex items-center justify-center gap-1 bg-success-c800 w-fit px-4 py-1.5 rounded-full cursor-pointer hover:bg-success-c700 active:bg-success-c900 hover:scale-105 duration-300 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${className}`}
        >
          {startIcon ? startIcon : null}
          <div className={`text-center font-medium text-sm text-white`}>{label}</div>
          {endIcon ? endIcon : null}
        </button>
      ) : null}

      {status === "error" ? (
        <button
          type={type}
          disabled={disabled}
          className={`flex items-center justify-center gap-1 bg-support-c900 w-fit px-4 py-1.5 rounded-full cursor-pointer hover:bg-support-c700 active:bg-support-c800 hover:scale-105 duration-300 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${className}`}
        >
          {startIcon ? startIcon : null}
          <div className={`text-center font-medium text-sm text-white`}>{label}</div>
          {endIcon ? endIcon : null}
        </button>
      ) : null}
    </div>
  );
};

export default Button;
