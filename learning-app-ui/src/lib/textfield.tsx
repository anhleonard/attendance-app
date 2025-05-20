"use client";
import { useState, useRef, useEffect } from "react";

interface TextFieldProps {
  label?: string;
  defaultValue?: string;
  onChange?: (value: string | React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  error?: boolean;
  helperText?: string;
  inputType?: string;
  disabled?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  inputClassName?: string;
  placeholder?: string;
  name?: string;
  value?: string;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const TextField = ({
  label = "Enter text",
  defaultValue = "",
  onChange,
  className = "",
  error = false,
  helperText = "",
  inputType = "text",
  disabled = false,
  startIcon,
  endIcon,
  inputClassName = "",
  placeholder = "",
  name,
  value: controlledValue,
  onBlur,
}: TextFieldProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // Thêm refs cho các icon
  const startIconRef = useRef<HTMLDivElement>(null);
  const endIconRef = useRef<HTMLDivElement>(null);
  const [startIconWidth, setStartIconWidth] = useState(0);
  const [endIconWidth, setEndIconWidth] = useState(0);

  // Đo kích thước thực tế của icon và thiết lập padding
  useEffect(() => {
    if (startIconRef.current) {
      const width = startIconRef.current.getBoundingClientRect().width;
      setStartIconWidth(width + 8); // thêm 16px để có khoảng cách
    }

    if (endIconRef.current) {
      const width = endIconRef.current.getBoundingClientRect().width;
      setEndIconWidth(width + 8); // thêm 16px để có khoảng cách
    }
  }, [startIcon, endIcon]);

  useEffect(() => {
    if (inputType === "amount" && defaultValue) {
      // Remove all non-digit characters
      let numericValue = defaultValue.replace(/\D/g, "");

      // Remove leading zeros except when the value is exactly "0"
      if (numericValue !== "0") {
        numericValue = numericValue.replace(/^0+/, "");
      }

      // If value is empty after removing zeros, keep it empty
      if (numericValue === "") {
        setInternalValue("");
      } else {
        // Format the number with commas
        const formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        setInternalValue(formattedValue);
      }
    }
  }, [defaultValue, inputType]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = event.target.value;

    if (inputType === "amount") {
      // Remove all non-digit characters
      let numericValue = newValue.replace(/\D/g, "");

      // Remove leading zeros
      numericValue = numericValue.replace(/^0+/, "");

      // If value is empty after removing zeros, keep it empty
      if (numericValue === "") {
        newValue = "";
      } else {
        // Format the number with commas
        newValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }
    }

    setInternalValue(newValue);
    // Pass the event directly to onChange if it's a form event handler
    if (onChange) {
      onChange(event);
    }
  };

  // Use controlled value if provided, otherwise use internal state
  const displayValue = controlledValue ?? internalValue;

  const handleLabelClick = () => {
    setIsFocused(true);
    inputRef.current?.focus();
  };

  return (
    <div>
      <div className={`relative w-full group ${className}`}>
        {/* Label */}
        <label
          onClick={disabled ? undefined : handleLabelClick}
          className={`absolute left-4 text-sm font-semibold transition-all duration-300 z-10 cursor-text
            ${
              isFocused || displayValue || startIcon || endIcon
                ? "-top-[8px] bg-white px-1 text-xs"
                : "left-4 top-[13px]"
            }
            ${isFocused ? "text-primary-c900" : "text-grey-c200"}
            ${error ? "bg-gradient-to-b from-transparent to-support-c10" : ""}
            ${disabled ? "bg-gradient-to-b from-transparent to-grey-c100/90 cursor-default" : ""}
          `}
        >
          {label}
        </label>

        {/* Input Box */}
        <div className="relative">
          {startIcon && (
            <div ref={startIconRef} className="absolute left-4 top-1/2 -translate-y-1/2">
              {startIcon}
            </div>
          )}
          <input
            ref={inputRef}
            type={inputType === "amount" ? "text" : inputType}
            name={name}
            value={displayValue}
            onChange={disabled ? undefined : handleChange}
            onKeyDown={(e) => {
              if (inputType === "amount") {
                // Allow: backspace, delete, tab, escape, enter, arrows
                if (
                  [8, 9, 13, 27, 46, 37, 38, 39, 40].includes(e.keyCode) ||
                  // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                  (e.keyCode >= 35 && e.keyCode <= 39) ||
                  (e.ctrlKey && [65, 67, 86, 88].includes(e.keyCode))
                ) {
                  return;
                }
                // Block any other key that is not a number
                if (!/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              }
            }}
            onBlur={onBlur}
            onFocus={() => !disabled && setIsFocused(true)}
            disabled={disabled}
            inputMode={inputType === "amount" ? "numeric" : undefined}
            style={{
              paddingLeft: startIcon ? `calc(1rem + ${startIconWidth}px)` : "1rem",
              paddingRight: endIcon ? `calc(1rem + ${endIconWidth}px)` : "1rem",
            }}
            placeholder={placeholder}
            className={`text-grey-c900 text-sm w-full border-2 rounded-[20px] py-3 outline-none transition-all
            ${
              isFocused && !error
                ? "border-primary-c900"
                : error
                ? "border-support-c100 bg-support-c10"
                : "border-grey-c200 group-hover:border-primary-c300"
            } ${disabled ? "bg-grey-c100/80 group-hover:border-grey-c200 text-grey-c400" : ""}
            ${inputType === "password" ? "font-mono text-sm placeholder:text-sm leading-[20px]" : ""}
            // placeholder:font-urbanist
            ${inputClassName}`}
          />
          {endIcon && (
            <div ref={endIconRef} className="absolute right-4 top-1/2 -translate-y-1/2">
              {endIcon}
            </div>
          )}
        </div>
      </div>
      {helperText ? <div className="text-xs mt-0.5 pl-1 text-support-c300">{helperText}</div> : null}
    </div>
  );
};

export default TextField;
