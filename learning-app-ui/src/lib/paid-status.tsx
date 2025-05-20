import { createPortal } from "react-dom";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface Status {
  label: string;
  color: string;
  hover: string;
  labelStyle: string;
}

const statuses: Status[] = [
  { label: "Sent", color: "text-[#FE9800]", hover: "hover:bg-[#FFE8C7]", labelStyle: "bg-[#FFE8C7]" },
  { label: "Paid", color: "text-[#357F3C]", hover: "hover:bg-success-c100", labelStyle: "bg-success-c100" },
  { label: "Saved", color: "text-primary-c900", hover: "hover:bg-primary-c100", labelStyle: "bg-primary-c100" },
];

export default function PaidStatus() {
  const [selectedStatus, setSelectedStatus] = useState<Status>(statuses[0]);
  const [open, setOpen] = useState<boolean>(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [dropdownWidth, setDropdownWidth] = useState(0);

  useEffect(() => {
    if (buttonRef.current) {
      setDropdownWidth(buttonRef.current.offsetWidth);
    }
  }, [selectedStatus]);

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  }, [open]);

  return (
    <div className="relative w-full">
      <button
        ref={buttonRef}
        className={`flex items-center justify-between w-full px-4 py-2 rounded-2xl font-semibold ${selectedStatus.color} ${selectedStatus.labelStyle}`}
        onClick={() => setOpen(!open)}
      >
        {selectedStatus.label}
        <div
          className={`w-4 h-4 flex justify-center items-center transition-transform ${
            open ? "rotate-180" : "rotate-0"
          }`}
        >
          <Image src="/icons/black-arrow.svg" alt="dropdown-icon" width={16} height={16} />
        </div>
      </button>

      {open &&
        createPortal(
          <ul
            className="fixed mt-0.5 rounded-lg shadow-lg bg-white z-[9999] overflow-hidden"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownWidth}px`,
            }}
          >
            {statuses.map((status) => (
              <li
                key={status.label}
                className={`text-sm px-4 py-2 cursor-pointer font-semibold ${status.color} ${status.hover}`}
                onClick={() => {
                  setSelectedStatus(status);
                  setOpen(false);
                }}
              >
                {status.label}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  );
}
