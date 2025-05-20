import TextField from "@/lib/textfield";
import React from "react";

interface Props {
  totalPayment: string;
}

const ConfirmBillModal = ({ totalPayment }: Props) => {
  return (
    <div className="py-2 flex flex-col gap-3">
      <TextField label="Total amount" inputType="number" defaultValue={totalPayment} />
      <TextField label="Paid amount" inputType="number" />
    </div>
  );
};

export default ConfirmBillModal;
