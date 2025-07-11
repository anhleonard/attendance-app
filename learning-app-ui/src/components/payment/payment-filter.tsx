"use client";
import { MONTHS } from "@/config/constants";
import Button from "@/lib/button";
import TextField from "@/lib/textfield";
import Select from "@/lib/select";
import { PaymentStatus } from "@/config/enums";
import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import { OptionState } from "@/config/types";

interface PaymentFilterProps {
  selectedStudent: string;
  setSelectedStudent: (value: string) => void;
  selectedClass: string;
  setSelectedClass: (value: string) => void;
  selectedStatus: string;
  setSelectedStatus: (value: string) => void;
  selectedMonth: string;
  setSelectedMonth: (value: string) => void;
  onFilter: () => void;
  onResetFilter: () => void;
  onFilterChange?: () => void;
}

const PaymentFilter = ({
  selectedStudent,
  setSelectedStudent,
  selectedClass,
  setSelectedClass,
  selectedStatus,
  setSelectedStatus,
  selectedMonth,
  setSelectedMonth,
  onFilter,
  onResetFilter,
  onFilterChange,
}: PaymentFilterProps) => {
  const activeClasses: OptionState[] = useSelector((state: RootState) => state.system.activeClasses) || [];

  const paymentStatusOptions = [
    { value: PaymentStatus.SAVED, label: "SAVED" },
    { value: PaymentStatus.SENT, label: "SENT" },
    { value: PaymentStatus.PAYING, label: "PAYING" },
    { value: PaymentStatus.DONE, label: "DONE" },
  ];

  const handleStudentChange = (value: string | React.ChangeEvent<HTMLInputElement>) => {
    if (typeof value === "string") {
      setSelectedStudent(value);
    } else {
      setSelectedStudent(value.target.value);
    }
    onFilterChange?.();
  };

  const handleClassChange = (value: string) => {
    setSelectedClass(value);
    onFilterChange?.();
  };

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
    onFilterChange?.();
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    onFilterChange?.();
  };

  return (
    <div className="grid grid-cols-3 gap-3 mb-5 mt-4">
      <TextField label="Student name" value={selectedStudent} onChange={handleStudentChange} />
      <Select
        label="Select class"
        options={activeClasses}
        defaultValue={selectedClass?.toString() || ""}
        onChange={handleClassChange}
      />
      <Select label="Select month" options={MONTHS} defaultValue={selectedMonth} onChange={handleMonthChange} />
      <Select
        label="Select status"
        options={paymentStatusOptions}
        defaultValue={selectedStatus}
        onChange={handleStatusChange}
      />

      <div className="flex flex-row gap-3">
        <Button label="Filter" className="py-[13px] px-8" status="success" onClick={onFilter} />
        <Button label="Cancel" className="py-[13px] px-8" status="cancel" onClick={onResetFilter} />
      </div>
    </div>
  );
};

export default PaymentFilter;
