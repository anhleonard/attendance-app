import Button from "@/lib/button";
import TextField from "@/lib/textfield";
import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useDispatch } from "react-redux";
import { closeLoading, openLoading } from "@/redux/slices/loading-slice";
import { updatePayment } from "@/apis/services/payment";
import { PaymentStatus } from "@/config/enums";
import { openAlert } from "@/redux/slices/alert-slice";
import { refetch } from "@/redux/slices/refetch-slice";
import { closeModal } from "@/redux/slices/modal-slice";

interface Props {
  paymentId: number;
  totalPayment: string;
  paidAmount: number | null;
  onSubmit?: (values: ConfirmBillFormValues) => void;
}

interface ConfirmBillFormValues {
  totalAmount: string;
  paidAmount: string;
  payableAmount: string;
}

const formatAmount = (amount: number): string => {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const ConfirmBillModal = ({ paymentId, totalPayment, paidAmount, onSubmit }: Props) => {
  const dispatch = useDispatch();

  // Calculate payable amount (remaining amount that can be paid)
  const totalAmountValue = parseInt(totalPayment);
  const alreadyPaidAmount = paidAmount || 0;
  const payableAmountValue = totalAmountValue - alreadyPaidAmount;

  const validationSchema = Yup.object().shape({
    payableAmount: Yup.string()
      .required("Payable amount is required")
      .test("is-valid-amount", "Please enter a valid amount", (value) => {
        if (!value) return false;
        const amount = parseFloat(value.replace(/[^\d.-]/g, ""));
        return !isNaN(amount) && amount > 0;
      })
      .test("is-not-zero", "Payable amount cannot be zero", (value) => {
        if (!value) return false;
        const amount = parseFloat(value.replace(/[^\d.-]/g, ""));
        return amount !== 0;
      })
      .test("is-not-exceed-payable", "Payable amount cannot exceed remaining amount", function (value) {
        if (!value) return true;
        const payableAmount = parseFloat(value.replace(/[^\d.-]/g, ""));
        return payableAmount <= payableAmountValue;
      }),
  });

  const formik = useFormik<ConfirmBillFormValues>({
    initialValues: {
      totalAmount: formatAmount(totalAmountValue),
      paidAmount: formatAmount(alreadyPaidAmount),
      payableAmount: "",
    },
    validationSchema,
    validateOnMount: true,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      try {
        dispatch(openLoading());
        const payableAmount = parseInt(values.payableAmount.replace(/,/g, ""));
        const newPaidAmount = alreadyPaidAmount + payableAmount;

        await updatePayment({
          paymentId,
          status: newPaidAmount >= totalAmountValue ? PaymentStatus.DONE : PaymentStatus.PAYING,
          paidAmount: newPaidAmount,
        });
        dispatch(
          openAlert({
            isOpen: true,
            title: "SUCCESS",
            subtitle: "Process payment successfully",
            type: "success",
          }),
        );
        dispatch(refetch());
      } catch (error: any) {
        dispatch(
          openAlert({
            isOpen: true,
            title: "ERROR",
            subtitle: error?.message || "Failed to process payment",
            type: "error",
          }),
        );
      } finally {
        dispatch(closeLoading());
        dispatch(closeModal());
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="py-3 px-3 flex flex-col gap-5">
      <TextField label="Total amount" inputType="amount" value={formik.values.totalAmount} disabled />
      <TextField label="Paid amount" inputType="amount" value={formik.values.paidAmount} disabled />
      <TextField label="Remaining amount" inputType="amount" value={formatAmount(payableAmountValue)} disabled />
      <TextField
        label="Payable amount"
        inputType="amount"
        name="payableAmount"
        value={formik.values.payableAmount}
        onChange={(e) => {
          if (typeof e === "string") {
            formik.setFieldValue("payableAmount", e);
          } else {
            let newValue = e.target.value;
            let numericValue = newValue.replace(/\D/g, "");
            numericValue = numericValue.replace(/^0+/, "");
            if (numericValue === "") {
              newValue = "";
            } else {
              newValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            }
            formik.setFieldValue("payableAmount", newValue);
          }
        }}
        onBlur={formik.handleBlur}
        error={Boolean(formik.touched.payableAmount && formik.errors.payableAmount)}
        helperText={
          formik.touched.payableAmount && formik.errors.payableAmount ? String(formik.errors.payableAmount) : undefined
        }
      />
      <div className="flex flex-row justify-end">
        <Button type="submit" label="Confirm" className="py-[13px] px-8" disabled={!formik.dirty} />
      </div>
    </form>
  );
};

export default ConfirmBillModal;
