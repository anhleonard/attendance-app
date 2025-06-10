import Button from "@/lib/button";
import TextField from "@/lib/textfield";
import React from "react";

interface Props {
  totalPayment: string;
}

const ConfirmBillModal = ({ totalPayment }: Props) => {
  return (
    <div className="py-3 px-3 flex flex-col gap-5">
      <TextField label="Total amount" inputType="amount" defaultValue={totalPayment} disabled />
      <TextField label="Paid amount" inputType="amount" />
      <div className="flex flex-row justify-end">
        <Button label="Confirm" className="py-[13px] px-8" status="success" />
      </div>
    </div>
  );
};

export default ConfirmBillModal;
