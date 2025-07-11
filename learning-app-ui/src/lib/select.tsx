"use client";
import { OptionState } from "@/config/types";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface Position {
  top?: number;
  left?: number;
  bottom?: number;
  right?: number;
}

interface SelectProps {
  options: OptionState[];
  label?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
  selectBoxClassName?: string;
  hasLabel?: boolean;
  position?: "top" | "bottom";
  customPosition?: Position;
  offsetY?: number;
  offsetX?: number;
  endIcon?: React.ReactNode;
  isRotateIcon?: boolean;
  error?: boolean;
  helperText?: string;
}

const Select = ({
  options = [],
  label = "Select an option",
  defaultValue = "",
  onChange,
  className = "",
  selectBoxClassName = "",
  hasLabel = true,
  position = "bottom",
  customPosition,
  offsetY = 12,
  offsetX = 0,
  endIcon,
  isRotateIcon = true,
  error = false,
  helperText = "",
}: SelectProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [selected, setSelected] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<Position>({ top: 0, left: 0 });
  const [dropdownWidth, setDropdownWidth] = useState(0);
  const [isBrowser, setIsBrowser] = useState(false);
  const optionsRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  useEffect(() => {
    if (defaultValue || defaultValue === "") {
      setSelected(defaultValue);
    }
  }, [defaultValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isOutsideSelect = selectRef.current && !selectRef.current.contains(event.target as Node);
      if (isOutsideSelect) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // useEffect(() => {
  //   if (isOpen && selectRef.current) {
  //     const rect = selectRef.current.getBoundingClientRect();

  //     if (customPosition) {
  //       setDropdownPosition(customPosition);
  //     } else {
  //       const offsetY = position === "top" ? 12 : 1;
  //       if (position === "top") {
  //         setDropdownPosition({
  //           top: rect.top + window.scrollY - (optionsRef.current?.offsetHeight || 0) - offsetY,
  //           left: rect.left + window.scrollX + offsetX,
  //         });
  //       } else {
  //         setDropdownPosition({
  //           top: rect.bottom + window.scrollY + offsetY,
  //           left: rect.left + window.scrollX + offsetX,
  //         });
  //       }
  //     }

  //     setDropdownWidth(rect.width);
  //   }
  // }, [isOpen, position, customPosition, offsetX, offsetY]);

  const updateDropdownPosition = () => {
    if (isOpen && selectRef.current) {
      const rect = selectRef.current.getBoundingClientRect();

      if (customPosition) {
        setDropdownPosition(customPosition);
      } else {
        const positionOffsetY = position === "top" ? 12 : 1;
        if (position === "top") {
          setDropdownPosition({
            top: rect.top + window.scrollY - (optionsRef.current?.offsetHeight || 0) - positionOffsetY,
            left: rect.left + window.scrollX + offsetX,
          });
        } else {
          setDropdownPosition({
            top: rect.bottom + window.scrollY + positionOffsetY,
            left: rect.left + window.scrollX + offsetX,
          });
        }
      }

      setDropdownWidth(rect.width);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Initial update
      updateDropdownPosition();
      
      // Track scroll changes
      const handleScroll = () => {
        updateDropdownPosition();
      };

      // Track size changes
      const handleResize = () => {
        updateDropdownPosition();
      };
      
      // Track zoom changes (actually track resize events)
      const handleZoom = () => {
        updateDropdownPosition();
      };

      // Register event listeners
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleResize);
      window.addEventListener("zoom", handleZoom);
      window.addEventListener("orientationchange", handleResize);

      // Use MutationObserver to track DOM changes that might affect the position
      const observer = new MutationObserver(() => {
        updateDropdownPosition();
      });

      if (selectRef.current && selectRef.current.parentElement) {
        observer.observe(selectRef.current.parentElement, {
          childList: true,
          subtree: true,
          attributes: true,
          characterData: true,
        });
      }

      // Cleanup
      return () => {
        window.removeEventListener("scroll", handleScroll, true);
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("zoom", handleZoom);
        window.removeEventListener("orientationchange", handleResize);
        observer.disconnect();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, position, customPosition, offsetX, offsetY]);

  const handleSelect = (value: string) => {
    setSelected(value);
    setIsOpen(false);
    setIsFocused(true);
    if (onChange) {
      onChange(value);
    }
  };

  const handleClick = () => {
    setIsOpen(!isOpen);
    setIsFocused(true);
  };

  const handleLabelClick = () => {
    setIsFocused(true);
    setIsOpen(!isOpen);
    selectRef.current?.focus();
  };

  const getSelectedLabel = () => {
    if (!selected) return "";

    const selectedOption = options?.find((opt) => opt?.value === selected);
    return selectedOption ? selectedOption.label : "";
  };

  const renderSelectedContent = () => {
    const label = getSelectedLabel();
    if (typeof label === "string") {
      return (
        <span
          className={`block w-full font-medium ${
            selected ? "text-black/80" : "text-grey-c200"
          } truncate overflow-hidden whitespace-nowrap text-ellipsis`}
        >
          {label}
        </span>
      );
    }
    return <div className="w-full">{label}</div>;
  };

  const handleOptionClick = (e: React.MouseEvent, value: string) => {
    e.preventDefault();
    e.stopPropagation();
    handleSelect(value);
  };

  const renderDropdown = () => {
    if (!isOpen || !isBrowser) return null;
    const dropdownStyle: React.CSSProperties = {
      width: `${dropdownWidth}px`,
      ...dropdownPosition,
    };

    return createPortal(
      <ul
        ref={optionsRef}
        className={`fixed max-h-[200px] overflow-y-auto bg-white border border-primary-c900 rounded-lg shadow-md overflow-hidden z-[9999]`}
        style={dropdownStyle}
        role="listbox"
        onClick={(e) => e.stopPropagation()}
      >
        {options.length === 0 ? (
          <li className="px-4 py-3 text-center text-grey-c300 font-medium text-sm">No option</li>
        ) : (
          options.map((option) => (
            <li
              key={option.value}
              className={`px-4 py-2 font-medium cursor-pointer transition text-sm ${
                selected === option.value ? "bg-primary-c800 text-white" : "text-grey-c900"
              } hover:bg-primary-c100 hover:text-grey-c900`}
              onClick={(e) => handleOptionClick(e, option.value)}
              onMouseDown={(e) => e.stopPropagation()}
              role="option"
              aria-selected={selected === option.value}
              tabIndex={0}
            >
              {option.label}
            </li>
          ))
        )}
      </ul>,
      document.body,
    );
  };

  return (
    <div>
      <div className={`relative w-full group ${className}`} ref={selectRef}>
        {hasLabel ? (
          <label
            onClick={handleLabelClick}
            className={`absolute left-4 text-sm font-semibold transition-all duration-200 z-10 hover:cursor-pointer
              ${isFocused || selected ? "-top-[8px] bg-white px-1 text-xs" : "left-4 top-[13px]"} 
              ${isFocused || isOpen ? "text-primary-c900" : "text-grey-c200"} 
              ${error ? "bg-gradient-to-b from-transparent to-support-c10" : ""}
            `}
          >
            {label}
          </label>
        ) : null}

        <div
          className={`relative flex items-center border-2 rounded-[20px] px-4 py-3 hover:cursor-pointer transition-all duration-200 ${
            (isFocused || isOpen) && !error
              ? "border-primary-c900"
              : error
              ? "border-support-c100 bg-support-c10"
              : "border-grey-c200 group-hover:border-primary-c300"
          } ${selectBoxClassName}`}
          onClick={handleClick}
          tabIndex={0}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls="select-options"
        >
          <div className="h-5 w-full flex items-center gap-2">
            {renderSelectedContent()}
            <span
              className={`block text-sm transition-transform ${isOpen && isRotateIcon ? "rotate-180" : ""}`}
              aria-hidden="true"
            >
              <div className="w-5 h-5 flex justify-center items-center">
                {endIcon ? endIcon : <Image src="/icons/arrow-down.svg" alt="dropdown-icon" width={16} height={16} />}
              </div>
            </span>
          </div>
        </div>

        {renderDropdown()}
      </div>
      {helperText ? <div className="text-xs mt-0.5 pl-1 text-support-c300">{helperText}</div> : null}
    </div>
  );
};

export default Select;
