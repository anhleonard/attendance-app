import React from "react";
import Button from "@/lib/button";
import Select from "@/lib/select";
import { PaymentStatus } from "@/config/enums";

interface BatchUpdateBarProps {
  count: number;
  onStatusChange: (
    status: string,
    selectionData: {
      isSelectedAll: boolean;
      unselectedPaymentIds: number[];
      selectedPaymentIds: number[];
    },
  ) => void;
  onCancel: () => void;
  loading: boolean;
  statusOptions: Array<{ value: string; label: string }>;
  isSelectedAll: boolean;
  unselectedPaymentIds: number[];
  selectedPaymentIds: number[];
}

export function BatchUpdateBar({
  count,
  onStatusChange,
  onCancel,
  loading,
  statusOptions,
  isSelectedAll,
  unselectedPaymentIds,
  selectedPaymentIds,
}: BatchUpdateBarProps) {
  const [selected, setSelected] = React.useState<string>("");

  // Reset selected status when options change
  React.useEffect(() => {
    setSelected("");
  }, [statusOptions]);

  const handleApply = () => {
    if (selected) {
      onStatusChange(selected, {
        isSelectedAll,
        unselectedPaymentIds,
        selectedPaymentIds,
      });
    }
  };

  return (
    <div className="fixed left-1/2 -translate-x-1/2 z-30 bottom-8 shadow-lg bg-white rounded-xl flex items-center p-4 border border-gray-300 space-x-4">
      {/* <span className="font-semibold text-gray-800">{count} selected</span> */}
      <Select
        options={statusOptions}
        defaultValue={selected}
        onChange={(value) => setSelected(value)}
        label="Update status"
        className="!w-48"
        position="top"
      />
      <Button
        label={loading ? "Updating..." : "Apply"}
        status="success"
        onClick={handleApply}
        disabled={!selected || loading}
        className="px-6"
      />
      <Button label="Cancel" status="cancel" onClick={onCancel} />
    </div>
  );
}
