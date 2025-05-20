"use client";
import Image from "next/image";
import React, { useState, useRef, useEffect } from "react";

interface CollapseProps {
  title: React.ReactNode | string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  titleClassName?: string;
  contentClassName?: string;
}

const Collapse: React.FC<CollapseProps> = ({
  title,
  children,
  defaultOpen = false,
  className = "",
  titleClassName = "",
  contentClassName = "",
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>(defaultOpen ? undefined : 0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  const toggleCollapse = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`overflow-hidden ${className}`}>
      <button
        onClick={toggleCollapse}
        className={`flex justify-between items-center w-full text-left font-medium focus:outline-none ${titleClassName}`}
        aria-expanded={isOpen}
      >
        <div>{title}</div>
        <Image src="/icons/arrow-down.svg" alt="dropdown-icon" width={16} height={16} />
      </button>
      <div
        style={{ height: contentHeight !== undefined ? `${contentHeight}px` : "auto" }}
        className={`transition-all duration-300 ease-in-out overflow-hidden ${contentClassName}`}
      >
        <div ref={contentRef} className="pt-5 flex flex-col gap-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Collapse;
