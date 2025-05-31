"use client";
import PaymentDetailModal from "@/components/payment/payment-detail-modal";
import { MONTHS } from "@/config/constants";
import { formatCurrency } from "@/config/functions";
import Button from "@/lib/button";
import Label from "@/lib/label";
import Pagination from "@/lib/pagination";
import Select from "@/lib/select";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { Tooltip } from "react-tooltip";
import Html2CanvasPro from "html2canvas-pro";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { ModalState } from "@/config/types";
import { useDispatch, useSelector } from "react-redux";
import { openModal } from "@/redux/slices/modal-slice";
import ConfirmBillModal from "@/components/payment/confirm-bill-modal";
import { getPayments } from "@/apis/services/payment";
import { FilterPaymentDto } from "@/apis/dto";
import { openLoading, closeLoading } from "@/redux/slices/loading-slice";
import { openAlert } from "@/redux/slices/alert-slice";
import { RootState } from "@/redux/store";
import moment from "moment";

interface PaymentResponse {
  total: number;
  data: {
    id: number;
    totalSessions: number;
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
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const currentMonth = moment().format("M");
  const currentYear = moment().format("YYYY");
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const refetchCount = useSelector((state: RootState) => state.refetch.count);
  const activeStudents: any = useSelector((state: RootState) => state.system.activeStudents) || [];
  const activeClasses: any = useSelector((state: RootState) => state.system.activeClasses) || [];

  const fetchPayments = async (currentPage: number, currentRowsPerPage: number) => {
    try {
      dispatch(openLoading());
      const filterData: FilterPaymentDto = {
        page: currentPage,
        rowPerPage: currentRowsPerPage,
        ...(selectedStudent && {
          name: activeStudents.find((student: any) => student.value === selectedStudent)?.label,
        }),
        ...(selectedClass && { classId: selectedClass }),
        learningMonth: parseInt(selectedMonth),
        learningYear: parseInt(currentYear),
      };
      const response = await getPayments(filterData);
      setPaymentsData(response);
    } catch (err: any) {
      dispatch(
        openAlert({
          isOpen: true,
          title: "ERROR",
          subtitle: err?.message || "Failed to fetch payments",
          type: "error",
        }),
      );
    } finally {
      dispatch(closeLoading());
    }
  };

  useEffect(() => {
    fetchPayments(page, rowsPerPage);
  }, [page, rowsPerPage, refetchCount, selectedStudent, selectedClass, selectedMonth]);

  const handlePageChange = (newPage: number, newRowsPerPage: number) => {
    if (newRowsPerPage !== rowsPerPage) {
      setRowsPerPage(newRowsPerPage);
      setPage(1); // Reset to first page when changing rows per page
    } else {
      setPage(newPage);
    }
  };

  const handleCancel = () => {
    setSelectedStudent(null);
    setSelectedClass(null);
    setSelectedMonth(currentMonth);
    setPage(1);
    fetchPayments(1, rowsPerPage);
  };

  const handleOpenModal = (payment: PaymentResponse["data"][0]) => {
    setSelectedPayment(payment);
    setShow(true);
  };

  const handleCloseModal = () => {
    setShow(false);
    setSelectedPayment(null);
  };

  const handleConfirmBill = (totalPayment: string) => {
    const modal: ModalState = {
      isOpen: true,
      title: "Update payment information",
      content: <ConfirmBillModal totalPayment={totalPayment} />,
      className: "max-w-lg",
    };

    dispatch(openModal(modal));
  };

  async function downloadAllImagesAsZip() {
    const zip = new JSZip();
    const folder = zip.folder("bills");

    if (!folder) {
      console.error("Cannot create ZIP folder!");
      return;
    }

    const promises = paymentsData.data.map(async (payment, index) => {
      const div = document.getElementById(`paymentDiv-${index}`);
      if (!div) {
        console.error(`Element paymentDiv-${index} not found!`);
        return;
      }

      try {
        const canvas = await Html2CanvasPro(div);

        // Bỏ đi "data:image/png;base64,"
        const imgData = canvas.toDataURL("image/png").split(",")[1];

        if (!imgData) {
          console.error(`Cannot create image for bill-${index + 1}`);
          return;
        }

        folder.file(`${paymentsData.data[index].student.name}.png`, imgData, { base64: true });
      } catch (error) {
        console.error(`Error when processing bill-${index}:`, error);
      }
    });

    await Promise.all(promises);

    if (Object.keys(folder.files).length === 0) {
      return;
    }

    zip.generateAsync({ type: "blob" }).then((content) => {
      saveAs(content, "MMA Class.zip");
    });
  }

  const handleDownloadAll = () => {
    downloadAllImagesAsZip();
  };

  const handleDownloadBillImage = async (id: string, studentName: string) => {
    const div = document.getElementById(id);
    if (!div) {
      console.error("Element paymentDiv not found!");
      return;
    }
    try {
      const canvas = await Html2CanvasPro(div);
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error("Cannot create Blob from canvas!");
          return;
        }
        saveAs(blob, `${studentName}.png`);
      }, "image/png");
    } catch (error) {
      console.error("Error when handling:", error);
    }
  };

  return (
    <div className="p-5">
      <div className="flex flex-row items-center gap-2 mb-8">
        <Image src="/icons/vertical-divide.svg" alt="vertical-divide" width={2} height={20} />
        <div className="text-xl font-bold">Payments</div>
      </div>
      <div className="flex flex-col">
        <div className="font-bold text-base">1. Payment list</div>

        {/* filter class */}
        <div className="grid grid-cols-4 gap-3 mb-5 mt-4">
          <Select
            label="Select student"
            options={activeStudents}
            defaultValue={selectedStudent || ""}
            onChange={(value) => setSelectedStudent(value)}
          />
          <Select
            label="Select class"
            options={activeClasses}
            defaultValue={selectedClass?.toString() || ""}
            onChange={(value) => setSelectedClass(value ? parseInt(value) : null)}
          />
          <Select
            label="Select month"
            options={MONTHS}
            defaultValue={selectedMonth}
            onChange={(value) => setSelectedMonth(value)}
          />
          <div className="flex flex-row gap-3">
            <Button label="Cancel" className="py-[13px] px-8" status="cancel" onClick={handleCancel} />
          </div>
        </div>

        <div className="flex flex-row justify-end">
          <Button
            label="Download All"
            className="mb-2"
            onClick={handleDownloadAll}
            status="success"
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
                  <th className="pl-3 py-4">STT</th>
                  <th className="px-1 py-4">Student</th>
                  <th className="px-1 py-4">Class</th>
                  <th className="px-1 py-4 text-center">Attendance</th>
                  <th className="px-1 py-4">Tuition/ month</th>
                  <th className="px-1 py-4">Debt</th>
                  <th className="px-1 py-4">Total paid</th>
                  <th className="px-1 py-4">Status</th>
                  <th className="px-1 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paymentsData.data.map((payment, index) => (
                  <tr key={payment.id} className="hover:bg-primary-c10">
                    <th className="pl-3 py-4">{(page - 1) * rowsPerPage + index + 1}</th>
                    <th className="px-1 py-4">{payment.student.name}</th>
                    <th className="px-1 py-4">{payment.student.currentClass?.name || "-"}</th>
                    <th className="px-1 py-4 text-center">{payment.totalAttend}</th>
                    <th className="px-1 py-4">
                      <span className="font-bold text-[#FE9800]">{formatCurrency(payment.totalMonthAmount)} VNĐ</span>
                    </th>
                    <th className="px-1 py-4">
                      {payment.student.debt === 0 ? (
                        <span className="font-bold text-success-c700">0 VNĐ</span>
                      ) : (
                        <span className="font-bold text-support-c500">
                          {payment.student.debt > 0
                            ? `-${formatCurrency(payment.student.debt)}`
                            : `+${formatCurrency(payment.student.debt * -1)}`}
                          VNĐ
                        </span>
                      )}
                    </th>
                    <th className="px-1 py-4">
                      <span className="font-bold text-primary-c900">
                        {formatCurrency(payment.totalPayment)}
                        VNĐ
                      </span>
                    </th>
                    <th className="px-1 py-4 relative">
                      <Label status="info" label={payment.status} />
                    </th>
                    <th className="px-1 py-4 text-center">
                      <div className="flex justify-center items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleOpenModal(payment);
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
                          onClick={() => handleDownloadBillImage(`paymentDiv-${index}`, payment.student.name)}
                        >
                          <Image src="/icons/download-icon.svg" alt="download-icon" width={24} height={24} />
                        </button>
                        <Tooltip id="download-icon" />
                        {payment.sentAt ? (
                          <>
                            <button
                              data-tooltip-id="sent-icon"
                              data-tooltip-content="Sent"
                              onClick={() => handleConfirmBill(payment.totalPayment.toString())}
                            >
                              <Image src="/icons/sent-icon.svg" alt="sent-icon" width={24} height={24} />
                            </button>
                            <Tooltip id="sent-icon" />
                          </>
                        ) : (
                          <>
                            <button data-tooltip-id="unsent-icon" data-tooltip-content="Send">
                              <Image src="/icons/unsent-icon.svg" alt="unsent-icon" width={24} height={24} />
                            </button>
                            <Tooltip id="unsent-icon" />
                          </>
                        )}
                      </div>
                    </th>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-5">
          <Pagination
            totalItems={paymentsData.total}
            rowsEachPage={rowsPerPage}
            nowPage={page}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      <PaymentDetailModal show={show} handleCloseModal={handleCloseModal} payment={selectedPayment || undefined} />

      {/* render all bills to download but will be hidden */}
      {paymentsData.data.map((payment, index) => (
        <div
          id={`paymentDiv-${index}`}
          key={`paymentDiv-${index}`}
          className="hidden-for-capture p-3 text-sm bg-primary-c900"
        >
          <div className="bg-white px-8 md:px-[70px] pt-4">
            {/* main content */}
            <div className="flex flex-col items-center justify-center w-full">
              <div className="font-bold text-lg text-grey-c900">
                HỌC PHÍ THÁNG {moment(payment.createdAt).format("MM/YYYY")}
              </div>
              <div className="font-semibold text-lg text-grey-c900">
                <span className="text-grey-c900 text-sm font-normal pr-2">Tên:</span>
                <span className="text-grey-c600 text-sm font-bold">{payment.student.name}</span>
              </div>
              <div className="grid md:grid-cols-2 w-full py-3 gap-4">
                {/* 1. table 1 */}
                <div className="max-w-[100%] rounded-[10px] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="table-auto w-full text-left relative">
                      <thead className={`text-grey-c700 uppercase bg-primary-c50`}>
                        <tr className="hover:bg-success-c50 hover:text-grey-c700 font-bold">
                          <th className="pl-3 py-4">STT</th>
                          <th className="px-1 py-4">Ngày học</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payment.attendances.map((attendance, idx) => (
                          <tr key={attendance.id} className="hover:bg-primary-c10 hover:text-grey-c700 text-grey-c900">
                            <th className="pl-3 py-4">{idx + 1}</th>
                            <th className="px-1 py-4">{moment(attendance.learningDate).format("DD/MM/YYYY")}</th>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. table 2 */}
                <div className="max-w-[100%]">
                  <div className="overflow-x-auto">
                    <table className="table-auto w-full text-left relative rounded-[10px] overflow-hidden">
                      <thead className={`text-grey-c700 uppercase bg-primary-c50`}>
                        <tr className="hover:bg-success-c50 hover:text-grey-c700 font-bold">
                          <th colSpan={2} className="py-4 text-center">
                            Summary
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-primary-c10 hover:text-grey-c700 text-grey-c900">
                          <th className="pl-3 py-4">Tổng số buổi</th>
                          <th className="px-1 py-4">{payment.totalSessions}</th>
                        </tr>
                        <tr className="hover:bg-primary-c10 hover:text-grey-c700 text-grey-c900">
                          <th className="pl-3 py-4">Học phí/buổi</th>
                          <th className="px-1 py-4">
                            {formatCurrency(payment.attendances[0]?.session.amount || 0)} VNĐ
                          </th>
                        </tr>
                        <tr className="hover:bg-primary-c10 hover:text-grey-c700 text-grey-c900">
                          <th className="pl-3 py-4">Tổng tiền</th>
                          <th className="px-1 py-4">{formatCurrency(payment.totalPayment)} VNĐ</th>
                        </tr>
                        <tr className="hover:bg-primary-c10 hover:text-grey-c700 text-grey-c900">
                          <th className="pl-3 py-4">Ngân hàng</th>
                          <th className="px-1 py-4">VIB</th>
                        </tr>
                        <tr className="hover:bg-primary-c10 hover:text-grey-c700 text-grey-c900">
                          <th className="pl-3 py-4">STK</th>
                          <th className="px-1 py-4">002122334</th>
                        </tr>
                        <tr className="hover:bg-primary-c10 hover:text-grey-c700 text-grey-c900">
                          <th className="pl-3 py-4">Chủ tài khoản</th>
                          <th className="px-1 py-4">TRẦN THỊ TRÂM</th>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Payments;
