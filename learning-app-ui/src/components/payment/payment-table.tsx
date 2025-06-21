"use client";
import { formatCurrency } from "@/config/functions";
import Button from "@/lib/button";
import Label from "@/lib/label";
import Pagination from "@/lib/pagination";
import Checkbox from "@/lib/checkbox";
import { EmptyRow } from "@/lib/empty-row";
import Image from "next/image";
import React from "react";
import { Tooltip } from "react-tooltip";
import { PaymentStatus } from "@/config/enums";
import moment from "moment";
import { generateBill, downloadAllBills } from "@/apis/services/bills";
import { closeLoading, openLoading } from "@/redux/slices/loading-slice";
import { useDispatch } from "react-redux";
import { openAlert } from "@/redux/slices/alert-slice";
import { PaymentData } from "@/config/types";
import { DownloadAllBillsDto } from "@/apis/dto";

interface PaymentTableProps {
  paymentsData: {
    total: number;
    data: PaymentData[];
  };
  page: number;
  rowsPerPage: number;
  allChecked: boolean;
  onSelectAll: (checked: boolean) => void;
  onSelectRow: (paymentId: number, checked: boolean) => void;
  isChecked: (paymentId: number) => boolean;
  onPageChange: (newPage: number, newRowsPerPage: number) => void;
  onOpenModal: (payment: PaymentData) => void;
  onConfirmBill: (paymentId: number, totalPayment: string, paidAmount: number | null) => void;
  onConfirmSent: (id: number) => void;
  onDownloadAll: () => void;
  selectedStudent?: string;
  selectedClass?: string;
  selectedStatus?: string;
  selectedMonth?: string;
  currentYear?: string;
  activeClasses?: any[];
}

const PaymentTable = ({
  paymentsData,
  page,
  rowsPerPage,
  allChecked,
  onSelectAll,
  onSelectRow,
  isChecked,
  onPageChange,
  onOpenModal,
  onConfirmBill,
  onConfirmSent,
  onDownloadAll,
  selectedStudent = "",
  selectedClass = "",
  selectedStatus = "",
  selectedMonth = "",
  currentYear = "",
  activeClasses = [],
}: PaymentTableProps) => {
  const dispatch = useDispatch();

  const getStatusLabel = (status: string) => {
    if (status === PaymentStatus.SENT) return "warning";
    if (status === PaymentStatus.SAVED) return "info";
    if (status === PaymentStatus.PAYING) return "progress";
    if (status === PaymentStatus.DONE) return "success";
    return "success";
  };

  const handleGenerateBill = async (payment: PaymentData) => {
    try {
      dispatch(openLoading());
      await generateBill({
        studentName: payment.student.name,
        class: payment.student.currentClass?.name || "",
        month: moment(payment.createdAt).format("MM/YYYY"),
        amount: payment.totalMonthAmount.toString(),
        learningDates: payment.attendances
          .filter((attendance) => attendance.isAttend)
          .map((attendance) => moment(attendance.learningDate).format("DD/MM/YYYY")),
        sessionCount: payment.totalAttend.toString(),
        amountPerSession: `${formatCurrency(payment.totalMonthAmount / payment.totalAttend)} VNĐ`,
        totalAmount: `${formatCurrency(payment.totalPayment)} VNĐ`,
      });
    } catch (error) {
      dispatch(openAlert({
        isOpen: true,
        title: "ERROR",
        subtitle: "Error downloading bill",
        type: "error",
        }),
      );
    } finally {
      dispatch(closeLoading());
    }
  };

  const handleDownloadAll = async () => {
    try {
      dispatch(openLoading());
      
      // Use the same logic as fetchPayments
      const downloadData: DownloadAllBillsDto = {
        learningMonth: parseInt(selectedMonth),
        learningYear: parseInt(currentYear),
        ...(selectedStudent && {
          name: selectedStudent,
        }),
        ...(selectedClass && {
          classId: activeClasses.find((cls: any) => cls.name === selectedClass)?.id || parseInt(selectedClass),
        }),
        ...(selectedStatus && {
          status: selectedStatus as PaymentStatus,
        }),
      };

      const url = await downloadAllBills(downloadData);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = `bills-${moment().format("DD-MM-YYYY")}.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      dispatch(openAlert({
        isOpen: true,
        title: "ERROR",
        subtitle: "Error downloading all bills",
        type: "error",
      }));
    } finally {
      dispatch(closeLoading());
    }
  };

  return (
    <>
      <div className="flex flex-row justify-end">
        <Button
          label="Download All"
          className="mb-2"
          onClick={handleDownloadAll}
          status="success"
          disabled={paymentsData.data.length === 0}
          startIcon={
            <Image src="/icons/file-download.svg" alt="file-download" width={18} height={18} className="py-1" />
          }
        />
      </div>

      {/* table */}
      <div className="max-w-[100%] rounded-[10px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-auto w-full text-left relative">
            <thead className={`text-grey-c700 uppercase bg-primary-c50`}>
              <tr className="hover:bg-success-c50 hover:text-grey-c700 font-bold">
                <th className="p-3 text-center">
                  <Checkbox isChecked={allChecked} onChange={onSelectAll} />
                </th>
                <th className="pl-3 py-4">STT</th>
                <th className="px-1 py-4">Student</th>
                <th className="px-1 py-4">Class</th>
                <th className="px-1 py-4 text-center">Attendance</th>
                <th className="px-1 py-4">Tuition/ month</th>
                <th className="px-1 py-4">Debt</th>
                <th className="px-1 py-4">Total amount</th>
                <th className="px-1 py-4">Paid amount</th>
                <th className="px-1 py-4">Payable amount</th>
                <th className="px-1 py-4">Status</th>
                <th className="px-1 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paymentsData.data.length > 0 ? (
                paymentsData.data.map((payment, index) => (
                  <tr key={payment.id} className="hover:bg-primary-c10">
                    <td className="p-3 text-center">
                      <Checkbox
                        isChecked={isChecked(payment.id)}
                        onChange={(checked) => onSelectRow(payment.id, checked)}
                      />
                    </td>
                    <th className="pl-3 py-4">{(page - 1) * rowsPerPage + index + 1}</th>
                    <th className="px-1 py-4">{payment.student.name}</th>
                    <th className="px-1 py-4">{payment.student.currentClass?.name || "-"}</th>
                    <th className="px-1 py-4 text-center">{payment.totalAttend}</th>
                    <th className="px-1 py-4">
                      <span className="font-bold text-[#FE9800]">{formatCurrency(payment.totalMonthAmount)}</span>
                    </th>
                    <th className="px-1 py-4">
                      {payment.student.debt === 0 ? (
                        <span className="font-bold text-success-c700">0</span>
                      ) : (
                        <span className="font-bold text-support-c500">
                          {payment.student.debt > 0
                            ? `-${formatCurrency(payment.student.debt)}`
                            : `+${formatCurrency(payment.student.debt * -1)}`}
                        </span>
                      )}
                    </th>
                    <th className="px-1 py-4">
                      <span className="font-bold text-primary-c900">{formatCurrency(payment.totalPayment)}</span>
                    </th>
                    <th className="px-1 py-4">
                      <span className="font-bold text-primary-c900">{formatCurrency(payment.paidPayment || 0)}</span>
                    </th>
                    <th className="px-1 py-4">
                      <span className="font-bold text-primary-c900">
                        {formatCurrency(payment.totalPayment - (payment.paidPayment || 0))}
                      </span>
                    </th>
                    <th className="px-1 py-4 relative">
                      <Label status={getStatusLabel(payment.status)} label={payment.status} />
                    </th>
                    <th className="px-1 py-4 text-center">
                      <div className="flex justify-center items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            onOpenModal(payment);
                          }}
                          title="View"
                          data-tooltip-id="view-icon"
                          data-tooltip-content="View"
                        >
                          <Image src="/icons/detail-icon.svg" alt="view-icon" width={24} height={24} />
                        </button>
                        <Tooltip id="view-icon" />
                        <button
                          data-tooltip-id="download-icon"
                          data-tooltip-content="Download"
                          onClick={() => handleGenerateBill(payment)}
                        >
                          <Image src="/icons/download-icon.svg" alt="download-icon" width={24} height={24} />
                        </button>
                        <Tooltip id="download-icon" />
                        {payment.status !== PaymentStatus.DONE &&
                          (payment.sentAt ? (
                            <>
                              <button
                                data-tooltip-id="sent-icon"
                                data-tooltip-content="Sent"
                                onClick={() =>
                                  onConfirmBill(payment.id, payment.totalPayment.toString(), payment.paidPayment || 0)
                                }
                              >
                                <Image
                                  src="/icons/sent-icon.svg"
                                  alt="sent-icon"
                                  width={24}
                                  height={24}
                                  className="transform rotate-[-45deg]"
                                />
                              </button>
                              <Tooltip id="sent-icon" />
                            </>
                          ) : (
                            <>
                              <button
                                data-tooltip-id="unsent-icon"
                                data-tooltip-content="Send"
                                onClick={() => onConfirmSent(payment.id)}
                              >
                                <Image
                                  src="/icons/unsent-icon.svg"
                                  alt="unsent-icon"
                                  width={25}
                                  height={25}
                                  className="transform rotate-180"
                                />
                              </button>
                              <Tooltip id="unsent-icon" />
                            </>
                          ))}
                      </div>
                    </th>
                  </tr>
                ))
              ) : (
                <EmptyRow colSpan={12} />
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-5">
        <Pagination
          totalItems={paymentsData.total}
          rowsEachPage={rowsPerPage}
          nowPage={page}
          onPageChange={onPageChange}
        />
      </div>
    </>
  );
};

export default PaymentTable;
