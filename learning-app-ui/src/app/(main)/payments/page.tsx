"use client";
import PaymentDetailModal from "@/components/payment/payment-detail-modal";
import { BatchUpdateBar } from "@/components/payment/batch-update-bar";
import PaymentFilter from "@/components/payment/payment-filter";
import PaymentTable from "@/components/payment/payment-table";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { ConfirmState, ModalState, OptionState } from "@/config/types";
import { useDispatch, useSelector } from "react-redux";
import { openModal } from "@/redux/slices/modal-slice";
import ConfirmBillModal from "@/components/payment/confirm-bill-modal";
import { getPayments, updatePayment, updateBatchPayments } from "@/apis/services/payment";
import { FilterPaymentDto, UpdateBatchPaymentsDto } from "@/apis/dto";
import { openLoading, closeLoading } from "@/redux/slices/loading-slice";
import { openAlert } from "@/redux/slices/alert-slice";
import { RootState } from "@/redux/store";
import moment from "moment";
import { closeConfirm, openConfirm } from "@/redux/slices/confirm-slice";
import { PaymentStatus } from "@/config/enums";
import { refetch } from "@/redux/slices/refetch-slice";

interface PaymentResponse {
  total: number;
  data: {
    id: number;
    totalAttend: number;
    totalMonthAmount: number;
    totalPayment: number;
    paidPayment: number | null;
    status: string;
    paymentNote: string;
    sentAt: string | null;
    createdAt: string;
    updatedAt: string;
    studentId: number;
    student: {
      id: number;
      name: string;
      debt: number;
      currentClass: {
        id: number;
        name: string;
      };
    };
    attendances: Array<{
      id: number;
      isAttend: boolean;
      noteAttendance: string;
      learningDate: string;
      session: {
        id: number;
        sessionKey: string;
        startTime: string;
        endTime: string;
        amount: number;
        class: {
          id: number;
          name: string;
        };
      };
    }>;
    classes: number[];
    attendanceStats: {
      total: number;
      attended: number;
      absent: number;
    };
  }[];
}

const Payments = () => {
  const dispatch = useDispatch();
  const [show, setShow] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentResponse["data"][0] | null>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [paymentsData, setPaymentsData] = useState<PaymentResponse>({ total: 0, data: [] });
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const currentMonth = moment().format("M");
  const currentYear = moment().format("YYYY");
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const refetchCount = useSelector((state: RootState) => state.refetch.count);
  const activeClasses: OptionState[] = useSelector((state: RootState) => state.system.activeClasses) || [];

  // Batch selection state
  const [allChecked, setAllChecked] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [isSelectedAll, setIsSelectedAll] = useState(false);
  const [unselectedPaymentIds, setUnselectedPaymentIds] = useState<number[]>([]);
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<number[]>([]);

  const fetchPayments = async (currentPage: number, currentRowsPerPage: number) => {
    try {
      dispatch(openLoading());
      const filterData: FilterPaymentDto = {
        page: currentPage,
        rowPerPage: currentRowsPerPage,
        ...(selectedStudent && {
          name: selectedStudent,
        }),
        ...(selectedClass && {
          classId: parseInt(activeClasses.find((cls: OptionState) => cls.label === selectedClass)?.value || selectedClass),
        }),
        ...(selectedStatus && {
          status: selectedStatus as PaymentStatus,
        }),
        learningMonth: parseInt(selectedMonth),
        learningYear: parseInt(currentYear),
      };
      const response = await getPayments(filterData);
      setPaymentsData(response);
    } finally {
      dispatch(closeLoading());
    }
  };

  useEffect(() => {
    fetchPayments(page, rowsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, refetchCount]);

  const handleFilter = () => {
    // Reset selections when applying filter
    setSelectedPaymentIds([]);
    setUnselectedPaymentIds([]);
    setIsSelectedAll(false);
    setAllChecked(false);

    setPage(1); // Reset to first page when filtering
    fetchPayments(1, rowsPerPage);
  };

  const handleResetFilter = async () => {
    // Reset states first
    setSelectedStudent("");
    setSelectedClass("");
    setSelectedStatus("");
    setSelectedMonth(currentMonth);
    setPage(1);
    setSelectedPaymentIds([]);
    setUnselectedPaymentIds([]);
    setIsSelectedAll(false);
    setAllChecked(false);

    // Call API with empty filters
    dispatch(openLoading());
    try {
      const response = await getPayments({
        page: 1,
        rowPerPage: rowsPerPage,
        name: "",
        classId: undefined,
        status: undefined,
        learningMonth: parseInt(currentMonth),
        learningYear: parseInt(currentYear),
      });
      if (response) {
        setPaymentsData(response);
      }
    } finally {
      dispatch(closeLoading());
    }
  };

  const handleFilterChange = () => {
    // Reset selections when filter values change
    setSelectedPaymentIds([]);
    setUnselectedPaymentIds([]);
    setIsSelectedAll(false);
    setAllChecked(false);
  };

  const handlePageChange = (newPage: number, newRowsPerPage: number) => {
    if (newRowsPerPage !== rowsPerPage) {
      setRowsPerPage(newRowsPerPage);
      setPage(1); // Reset to first page when changing rows per page
    } else {
      setPage(newPage);
    }
  };

  const handleOpenModal = (payment: PaymentResponse["data"][0]) => {
    setSelectedPayment(payment);
    setShow(true);
  };

  const handleCloseModal = () => {
    setShow(false);
    setSelectedPayment(null);
  };

  const handleConfirmBill = (paymentId: number, totalPayment: string, paidAmount: number | null) => {
    const modal: ModalState = {
      isOpen: true,
      title: "Update payment information",
      content: <ConfirmBillModal paymentId={paymentId} totalPayment={totalPayment} paidAmount={paidAmount} />,
      className: "max-w-lg",
    };

    dispatch(openModal(modal));
  };

  const handleConfirmSent = (id: number) => {
    const confirmModal: ConfirmState = {
      isOpen: true,
      title: "Confirm sent",
      subtitle: "Are you sure you sent this payment?",
      titleAction: "Confirm",
      handleAction: async () => {
        try {
          dispatch(openLoading());
          await updatePayment({ paymentId: id, status: PaymentStatus.SENT });
          dispatch(
            openAlert({
              isOpen: true,
              title: "SUCCESS",
              subtitle: "Payment sent successfully",
              type: "success",
            }),
          );
          dispatch(refetch());
        } finally {
          dispatch(closeLoading());
          dispatch(closeConfirm());
        }
      },
    };
    dispatch(openConfirm(confirmModal));
  };

  // Batch selection functions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select all visible payments - switch to isSelectedAll mode
      setIsSelectedAll(true);
      setSelectedPaymentIds([]);
      setUnselectedPaymentIds([]);
      setAllChecked(true);
    } else {
      // Deselect all payments
      setSelectedPaymentIds([]);
      setUnselectedPaymentIds([]);
      setIsSelectedAll(false);
      setAllChecked(false);
    }
  };

  const handleSelectRow = (paymentId: number, checked: boolean) => {
    if (isSelectedAll) {
      // When all are selected, only manage unselected items
      if (checked) {
        // Remove from unselected list
        setUnselectedPaymentIds((prev) => prev.filter((id) => id !== paymentId));
      } else {
        // Add to unselected list
        setUnselectedPaymentIds((prev) => [...prev, paymentId]);
      }
    } else {
      // When not all selected, only manage selected items
      if (checked) {
        // Add to selected list
        setSelectedPaymentIds((prev) => [...prev, paymentId]);
      } else {
        // Remove from selected list
        setSelectedPaymentIds((prev) => prev.filter((id) => id !== paymentId));
      }
    }
  };

  const isChecked = (paymentId: number) => {
    if (isSelectedAll) {
      return !unselectedPaymentIds.includes(paymentId);
    } else {
      return selectedPaymentIds.includes(paymentId);
    }
  };

  // Calculate status options based on selected payments
  const getBatchStatusOptions = () => {
    const effectiveSelectedPayments = isSelectedAll
      ? paymentsData.data.filter((payment) => !unselectedPaymentIds.includes(payment.id))
      : paymentsData.data.filter((payment) => selectedPaymentIds.includes(payment.id));

    if (effectiveSelectedPayments.length === 0) return [];

    // Get unique statuses from selected payments
    const uniqueStatuses = [...new Set(effectiveSelectedPayments.map((payment) => payment.status))];

    // If all selected items have status SAVED, only allow SENT
    if (uniqueStatuses.length === 1 && uniqueStatuses[0] === PaymentStatus.SAVED) {
      return [{ value: PaymentStatus.SENT, label: "SENT" }];
    }

    // If all selected items have status SENT, only allow DONE
    if (uniqueStatuses.length === 1 && uniqueStatuses[0] === PaymentStatus.SENT) {
      return [{ value: PaymentStatus.DONE, label: "DONE" }];
    }

    // If all selected items have status PAYING, only allow DONE
    if (uniqueStatuses.length === 1 && uniqueStatuses[0] === PaymentStatus.PAYING) {
      return [{ value: PaymentStatus.DONE, label: "DONE" }];
    }

    // If all selected items have status SENT or PAYING (mixed between these two), allow DONE
    if (
      uniqueStatuses.length === 2 &&
      uniqueStatuses.includes(PaymentStatus.SENT) &&
      uniqueStatuses.includes(PaymentStatus.PAYING)
    ) {
      return [{ value: PaymentStatus.DONE, label: "DONE" }];
    }

    // For any other mixed statuses, return empty array (no batch update allowed)
    return [];
  };

  const handleBatchStatusUpdate = async (
    status: string,
    selectionData: {
      isSelectedAll: boolean;
      unselectedPaymentIds: number[];
      selectedPaymentIds: number[];
    },
  ) => {
    const effectiveSelectedPayments = selectionData.isSelectedAll
      ? paymentsData.data.filter((payment) => !selectionData.unselectedPaymentIds.includes(payment.id))
      : paymentsData.data.filter((payment) => selectionData.selectedPaymentIds.includes(payment.id));

    if (effectiveSelectedPayments.length === 0) return;

    const confirmModal: ConfirmState = {
      isOpen: true,
      title: "Confirm batch update",
      subtitle: `Are you sure you want to update all of these payments to ${status}?`,
      titleAction: "Confirm",
      handleAction: async () => {
        try {
          setBatchLoading(true);
          dispatch(openLoading());

          // Use batch update instead of individual updates
          const batchData: UpdateBatchPaymentsDto = {
            status: status as PaymentStatus.SENT | PaymentStatus.DONE,
            filter: {
              name: selectedStudent || undefined,
              classId: parseInt(activeClasses.find((cls: OptionState) => cls.label === selectedClass)?.value || "0") || undefined,
              status: (selectedStatus as PaymentStatus) || undefined,
              learningMonth: parseInt(selectedMonth) || undefined,
              learningYear: parseInt(currentYear) || undefined,
            },
          };

          if (selectionData.isSelectedAll) {
            batchData.isSelectedAll = true;
            batchData.unselectedPaymentIds = selectionData.unselectedPaymentIds;
          } else {
            batchData.isSelectedAll = false;
            batchData.selectedPaymentIds = selectionData.selectedPaymentIds;
          }

          await updateBatchPayments(batchData);

          dispatch(
            openAlert({
              isOpen: true,
              title: "SUCCESS",
              subtitle: `Successfully updated ${effectiveSelectedPayments.length} payments`,
              type: "success",
            }),
          );

          // Clear selection and refetch data
          setSelectedPaymentIds([]);
          setUnselectedPaymentIds([]);
          setIsSelectedAll(false);
          setAllChecked(false);
          dispatch(refetch());
        } finally {
          setBatchLoading(false);
          dispatch(closeLoading());
          dispatch(closeConfirm());
        }
      },
    };
    dispatch(openConfirm(confirmModal));
  };

  return (
    <div className="p-5">
      <div className="flex flex-row items-center gap-2 mb-8">
        <Image src="/icons/vertical-divide.svg" alt="vertical-divide" width={2} height={20} />
        <div className="text-xl font-bold">Payments</div>
      </div>
      <div className="flex flex-col">
        <div className="font-bold text-base">1. Payment list</div>

        <PaymentFilter
          selectedStudent={selectedStudent}
          setSelectedStudent={setSelectedStudent}
          selectedClass={selectedClass}
          setSelectedClass={setSelectedClass}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          onFilter={handleFilter}
          onResetFilter={handleResetFilter}
          onFilterChange={handleFilterChange}
        />

        <PaymentTable
          paymentsData={paymentsData}
          page={page}
          rowsPerPage={rowsPerPage}
          allChecked={allChecked}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          isChecked={isChecked}
          onPageChange={handlePageChange}
          onOpenModal={handleOpenModal}
          onConfirmBill={handleConfirmBill}
          onConfirmSent={handleConfirmSent}
          selectedStudent={selectedStudent}
          selectedClass={selectedClass}
          selectedStatus={selectedStatus}
          selectedMonth={selectedMonth}
          currentYear={currentYear}
          activeClasses={activeClasses}
        />
      </div>

      <PaymentDetailModal show={show} handleCloseModal={handleCloseModal} payment={selectedPayment || undefined} />

      {(isSelectedAll || selectedPaymentIds.length > 0) && (
        <BatchUpdateBar
          onStatusChange={handleBatchStatusUpdate}
          onCancel={() => {
            setSelectedPaymentIds([]);
            setUnselectedPaymentIds([]);
            setIsSelectedAll(false);
            setAllChecked(false);
          }}
          loading={batchLoading}
          statusOptions={getBatchStatusOptions()}
          isSelectedAll={isSelectedAll}
          unselectedPaymentIds={unselectedPaymentIds}
          selectedPaymentIds={selectedPaymentIds}
        />
      )}
    </div>
  );
};

export default Payments;
