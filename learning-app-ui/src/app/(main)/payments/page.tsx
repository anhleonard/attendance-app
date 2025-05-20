"use client";
import PaymentDetailModal from "@/components/payment/payment-detail-modal";
import { MONTHS } from "@/config/constants";
import { formatCurrency } from "@/config/functions";
import Button from "@/lib/button";
import Label from "@/lib/label";
import Pagination from "@/lib/pagination";
import Select from "@/lib/select";
import Image from "next/image";
import React, { useState } from "react";
import { Tooltip } from "react-tooltip";
import Html2CanvasPro from "html2canvas-pro";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { ModalState } from "@/config/types";
import { useDispatch } from "react-redux";
import { openModal } from "@/redux/slices/modal-slice";
import ConfirmBillModal from "@/components/payment/confirm-bill-modal";

const billsData = [
  {
    studentName: "Christopher Smith",
    month: "01/2024",
    attendanceDates: ["08/01/2024", "10/01/2024", "12/01/2024"],
    totalSessions: 3,
    feePerSession: 50000,
    totalMonth: 150000,
    debt: 50000,
    totalAmount: 200000,
  },
  {
    studentName: "Matthew Williams",
    month: "02/2024",
    attendanceDates: ["02/02/2024", "05/02/2024", "07/02/2024", "10/02/2024"],
    totalSessions: 4,
    feePerSession: 60000,
    totalMonth: 240000,
    debt: 100000,
    totalAmount: 340000,
  },
  {
    studentName: "Ashley Anderson",
    month: "03/2024",
    attendanceDates: ["03/03/2024", "06/03/2024", "09/03/2024", "12/03/2024", "15/03/2024"],
    totalSessions: 5,
    feePerSession: 55000,
    totalMonth: 275000,
    debt: 0,
    totalAmount: 275000,
  },
  {
    studentName: "Elizabeth Thomas",
    month: "04/2024",
    attendanceDates: ["01/04/2024", "04/04/2024", "07/04/2024"],
    totalSessions: 3,
    feePerSession: 70000,
    totalMonth: 210000,
    debt: 50000,
    totalAmount: 260000,
  },
  {
    studentName: "Daniel Martinez",
    month: "05/2024",
    attendanceDates: ["05/05/2024", "07/05/2024", "10/05/2024", "12/05/2024", "15/05/2024"],
    totalSessions: 5,
    feePerSession: 65000,
    totalMonth: 325000,
    debt: 75000,
    totalAmount: 400000,
  },
  {
    studentName: "James Taylor",
    month: "06/2024",
    attendanceDates: ["02/06/2024", "05/06/2024", "08/06/2024"],
    totalSessions: 3,
    feePerSession: 80000,
    totalMonth: 240000,
    debt: 20000,
    totalAmount: 260000,
  },
  {
    studentName: "Sarah Wilson",
    month: "07/2024",
    attendanceDates: ["01/07/2024", "03/07/2024", "05/07/2024", "07/07/2024"],
    totalSessions: 4,
    feePerSession: 75000,
    totalMonth: 300000,
    debt: -150000,
    totalAmount: 450000,
  },
  {
    studentName: "Michael Johnson",
    month: "07/2024",
    attendanceDates: ["02/07/2024", "04/07/2024", "06/07/2024"],
    totalSessions: 3,
    feePerSession: 75000,
    totalMonth: 225000,
    debt: 0,
    totalAmount: 225000,
  },
  {
    studentName: "Emily Davis",
    month: "07/2024",
    attendanceDates: ["01/07/2024", "03/07/2024", "05/07/2024", "08/07/2024"],
    totalSessions: 4,
    feePerSession: 75000,
    totalMonth: 300000,
    debt: 50000,
    totalAmount: 250000,
  },
  {
    studentName: "Jessica Brown",
    month: "07/2024",
    attendanceDates: ["01/07/2024", "03/07/2024", "07/07/2024", "09/07/2024", "11/07/2024"],
    totalSessions: 5,
    feePerSession: 75000,
    totalMonth: 375000,
    debt: -100000,
    totalAmount: 475000,
  },
];

const Payments = () => {
  const dispatch = useDispatch();
  const [show, setShow] = useState(false);

  const handleOpenModal = () => {
    setShow(true);
  };

  const handleCloseModal = () => {
    setShow(false);
  };

  async function downloadAllImagesAsZip() {
    const zip = new JSZip();
    const folder = zip.folder("bills");

    if (!folder) {
      console.error("Cannot create ZIP folder!");
      return;
    }

    const promises = billsData.map(async (bill, index) => {
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

        folder.file(`${billsData[index].studentName}.png`, imgData, { base64: true });
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

  const handleConfirmBill = (totalPayment: string) => {
    const modal: ModalState = {
      isOpen: true,
      title: "Update payment information",
      content: <ConfirmBillModal totalPayment={totalPayment} />,
      className: "max-w-lg",
    };

    dispatch(openModal(modal));
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
            options={[
              { label: "Anh Leonard", value: "MMA" },
              { label: "Norbu Wangmo", value: "TLA" },
            ]}
            defaultValue="MMA"
          />
          <Select
            label="Select class"
            options={[
              { label: "MMA Class", value: "MMA_CLASS" },
              { label: "TLA Class", value: "TLA_CLASS" },
            ]}
            defaultValue="MMA_CLASS"
          />
          <Select label="Select month" options={MONTHS} />
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

        {/* table 1 */}
        <div className="max-w-[100%] rounded-[10px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-auto w-full text-left relative">
              <thead className={`text-grey-c700 uppercase bg-primary-c50`}>
                <tr className="hover:bg-success-c50 hover:text-grey-c700 font-bold">
                  <th className="pl-3 py-4">STT</th>
                  <th className="px-1 py-4">Student</th>
                  <th className="px-1 py-4">Total sessions</th>
                  <th className="px-1 py-4">Tuition/ month</th>
                  <th className="px-1 py-4">Debt</th>
                  <th className="px-1 py-4">Total paid</th>
                  <th className="px-1 py-4">Status</th>
                  <th className="px-1 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {billsData.map((bill, index) => {
                  return (
                    <tr key={index} className="hover:bg-primary-c10">
                      <th className="pl-3 py-4">{index + 1}</th>
                      <th className="px-1 py-4 font-questrial text-grey-c900 text-[15px]">{bill.studentName}</th>
                      <th className="px-1 py-4">{bill.totalSessions}</th>
                      <th className="px-1 py-4">
                        <span className="font-bold text-[#FE9800]">{formatCurrency(bill.totalMonth)} VND</span>
                      </th>
                      <th className="px-1 py-4">
                        {bill.debt === 0 ? (
                          <span className="font-bold text-success-c700">0 VND</span>
                        ) : (
                          <span className="font-bold text-support-c500">
                            {bill.debt > 0 ? `-${formatCurrency(bill.debt)}` : `+${formatCurrency(bill.debt * -1)}`}
                            VND
                          </span>
                        )}
                      </th>
                      <th className="px-1 py-4">
                        <span className="font-bold text-primary-c900">
                          {formatCurrency(bill.totalMonth + bill.debt)}
                          VND
                        </span>
                      </th>
                      <th className="px-1 py-4 relative">
                        <Label status="info" label="Saved" />
                      </th>
                      <th className="px-1 py-4 text-center">
                        <div className="flex justify-center items-center gap-3">
                          <button
                            onClick={handleOpenModal}
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
                            onClick={() => handleDownloadBillImage(`paymentDiv-${index}`, bill.studentName)}
                          >
                            <Image src="/icons/download-icon.svg" alt="download-icon" width={24} height={24} />
                          </button>
                          <Tooltip id="download-icon" />
                          {index % 2 === 0 ? (
                            <>
                              <button
                                data-tooltip-id="sent-icon"
                                data-tooltip-content="Sent"
                                onClick={() => {
                                  handleConfirmBill(bill.totalAmount.toString());
                                }}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-5">
          <Pagination
            totalItems={50}
            onPageChange={(page: number, rowsPerPage: number) => console.log({ page, rowsPerPage })}
          />
        </div>
      </div>

      <PaymentDetailModal show={show} handleCloseModal={handleCloseModal} />

      {/* render all bills to download but will be hidden */}
      {billsData.map((billData, index) => {
        return (
          <div
            id={`paymentDiv-${index}`}
            key={`paymentDiv-${index}`}
            className="hidden-for-capture p-3 text-sm bg-primary-c900"
          >
            <div className="bg-white px-8 md:px-[70px] pt-4">
              {/* main content */}
              <div className="flex flex-col items-center justify-center w-full">
                <div className="font-bold text-lg text-grey-c900">HỌC PHÍ THÁNG 01/2024</div>
                <div className="font-semibold text-lg text-grey-c900">
                  <span className="text-grey-c900 text-sm font-normal pr-2">Tên:</span>
                  <span className="text-grey-c600 text-sm font-bold">{billData.studentName}</span>
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
                          {Array.from({ length: 10 }).map((_, index) => (
                            <tr key={index} className="hover:bg-primary-c10 hover:text-grey-c700 text-grey-c900">
                              <th className="pl-3 py-4">{index + 1}</th>
                              <th className="px-1 py-4">{billData.attendanceDates[index] || ""}</th>
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
                            <th className="px-1 py-4">{billData.totalSessions}</th>
                          </tr>
                          <tr className="hover:bg-primary-c10 hover:text-grey-c700 text-grey-c900">
                            <th className="pl-3 py-4">Học phí/buổi</th>
                            <th className="px-1 py-4">{formatCurrency(billData.feePerSession)} VND</th>
                          </tr>
                          <tr className="hover:bg-primary-c10 hover:text-grey-c700 text-grey-c900">
                            <th className="pl-3 py-4">Tổng tiền</th>
                            <th className="px-1 py-4">{formatCurrency(billData.totalAmount)} VND</th>
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
        );
      })}
    </div>
  );
};

export default Payments;
