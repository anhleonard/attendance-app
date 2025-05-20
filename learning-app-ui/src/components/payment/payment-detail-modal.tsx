"use client";
import React, { Fragment } from "react";
import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react";
import Image from "next/image";
import Button from "@/lib/button";
import Html2CanvasPro from "html2canvas-pro";

interface Props {
  show: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleCloseModal: any;
}

const PaymentDetailModal = ({ show, handleCloseModal }: Props) => {
  async function downloadBillPayment() {
    const div = document.getElementById("paymentDiv");
    if (!div) {
      console.error("Element not found!");
      return;
    }

    try {
      // Clone div và chuẩn bị nó để capture
      const clonedDiv = div.cloneNode(true) as HTMLElement;

      // Lấy các style tính toán từ div gốc
      const computedStyle = window.getComputedStyle(div);

      // Đặt vị trí ngoài màn hình cho bản sao, nhưng giữ nguyên kích thước và style
      clonedDiv.style.position = "absolute";
      clonedDiv.style.left = "-9999px";
      clonedDiv.style.top = "0";
      clonedDiv.style.width = computedStyle.width;

      // Đảm bảo hiển thị đầy đủ nội dung của div
      clonedDiv.style.height = "auto";
      clonedDiv.style.maxHeight = "none";
      clonedDiv.style.overflow = "visible";

      // Đảm bảo viền được hiển thị đầy đủ
      clonedDiv.style.border = computedStyle.border;
      clonedDiv.style.borderRadius = computedStyle.borderRadius;

      // Thêm padding dưới để đảm bảo chụp được phần cuối
      clonedDiv.style.paddingBottom = "12px";

      // Thêm vào DOM để có thể chụp
      document.body.appendChild(clonedDiv);

      // Tìm và ẩn các nút không cần thiết trong bản sao
      const clonedDeleteButton = clonedDiv.querySelector("#deleteButton") as HTMLElement;
      const clonedDownloadButton = clonedDiv.querySelector("#downloadButton") as HTMLElement;

      if (clonedDeleteButton) clonedDeleteButton.style.display = "none";
      if (clonedDownloadButton) clonedDownloadButton.style.display = "none";

      // Đảm bảo các hình ảnh trong bản sao đã tải xong
      const images = clonedDiv.getElementsByTagName("img");
      if (images.length > 0) {
        await Promise.all(
          Array.from(images).map((img) => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
              // Đảm bảo hình ảnh không tải được sẽ không chờ mãi
              setTimeout(resolve, 1000);
            });
          }),
        );
      }

      // Chụp với các tùy chọn nâng cao
      const canvas = await Html2CanvasPro(clonedDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: null,
        height: clonedDiv.scrollHeight, // Đặt chiều cao chính xác
        windowHeight: clonedDiv.scrollHeight + 100, // Thêm dư để đảm bảo chụp đủ
        onclone: (clonedDoc) => {
          // Nếu cần thêm xử lý cho phần tử đã clone
          const clonedElement = clonedDoc.querySelector("body > [style*='position: absolute']") as HTMLElement;
          if (clonedElement) {
            clonedElement.style.height = "auto";
            clonedElement.style.maxHeight = "none";
          }
        },
      });

      // Dọn dẹp sau khi chụp xong
      document.body.removeChild(clonedDiv);

      // Xử lý và tải xuống hình ảnh
      const imgData = canvas.toDataURL("image/png");
      const blob = await fetch(imgData).then((res) => res.blob());

      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = "bill_payment.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error taking photo:", error);
    }
  }

  return (
    <Transition appear show={show} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50" onClose={handleCloseModal}>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/40" />
            </TransitionChild>

            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="relative transform overflow-hidden bg-white text-left align-middle shadow-xl transition-all w-11/12 sm:w-10/12 md:w-9/12">
                <div id="paymentDiv" className="w-full max-h-[90vh] overflow-auto p-3 text-sm bg-primary-c900">
                  <div className="bg-white px-8 md:px-[70px] pt-4">
                    <div className="text-end" id="deleteButton">
                      <button
                        className="hover:bg-grey-c50 p-1.5 rounded-full active:bg-grey-c100 transition-transform duration-300"
                        onClick={handleCloseModal}
                      >
                        <Image src="/icons/close-icon.svg" alt="close-icon" width={20} height={20} />
                      </button>
                    </div>
                    {/* main content */}
                    <div className="flex flex-col items-center justify-center w-full">
                      <div className="font-bold text-lg text-grey-c900">HỌC PHÍ THÁNG 01/2024</div>
                      <div className="font-semibold text-lg text-grey-c900">
                        <span className="text-grey-c900 text-sm font-normal pr-2">Tên:</span>
                        <span className="text-grey-c600 text-sm font-bold font-questrial">Hoàng Đỗ Nhật Minh</span>
                      </div>
                      <div className="grid md:grid-cols-2 w-full py-3 gap-4">
                        {/* 1. table 1 */}
                        <div className="max-w-[100%] rounded-[10px] overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="table-auto w-full text-left relative">
                              <thead className={`text-grey-c700 uppercase bg-primary-c50`}>
                                <tr className="hover:bg-success-c50 hover:text-grey-c700 font-bold">
                                  <th className="pl-3 py-4 font-questrial">STT</th>
                                  <th className="px-1 py-4 font-questrial">Ngày học</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Array.from({ length: 10 }).map((_, index) => (
                                  <tr key={index} className="hover:bg-primary-c10 hover:text-grey-c700 text-grey-c900">
                                    <th className="pl-3 py-4">{index + 1}</th>
                                    <th className="px-1 py-4">08/01/2024</th>
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
                                  <th colSpan={2} className="py-4 text-center font-questrial">
                                    TỔNG KẾT
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="hover:bg-primary-c10 hover:text-grey-c700 text-grey-c900">
                                  <th className="pl-3 py-4 font-questrial">Tổng số buổi</th>
                                  <th className="px-1 py-4">7</th>
                                </tr>
                                <tr className="hover:bg-primary-c10 hover:text-grey-c700 text-grey-c900">
                                  <th className="pl-3 py-4 font-questrial">Học phí/buổi</th>
                                  <th className="px-1 py-4">50.000 VND</th>
                                </tr>
                                <tr className="hover:bg-primary-c10 hover:text-grey-c700 text-grey-c900">
                                  <th className="pl-3 py-4 font-questrial">Học phí tháng</th>
                                  <th className="px-1 py-4">350.000 VND</th>
                                </tr>
                                <tr className="hover:bg-primary-c10 hover:text-grey-c700 text-grey-c900">
                                  <th className="pl-3 py-4 font-questrial">Tiền nợ</th>
                                  <th className="px-1 py-4">100.000 VND</th>
                                </tr>
                                <tr className="hover:bg-primary-c10 hover:text-grey-c700 text-grey-c900">
                                  <th className="pl-3 py-4 font-questrial">Tổng tiền</th>
                                  <th className="px-1 py-4">450.000 VND</th>
                                </tr>
                                <tr className="hover:bg-primary-c10 hover:text-grey-c700 text-grey-c900">
                                  <th className="pl-3 py-4 font-questrial">Ngân hàng</th>
                                  <th className="px-1 py-4">VIB</th>
                                </tr>
                                <tr className="hover:bg-primary-c10 hover:text-grey-c700 text-grey-c900">
                                  <th className="pl-3 py-4 font-questrial">STK</th>
                                  <th className="px-1 py-4">002122334</th>
                                </tr>
                                <tr className="hover:bg-primary-c10 hover:text-grey-c700 text-grey-c900">
                                  <th className="pl-3 py-4 font-questrial">Chủ tài khoản</th>
                                  <th className="px-1 py-4">TRẦN THỊ TRÂM</th>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div id="downloadButton" className="pt-1 pb-5 flex flex-row justify-end">
                      <Button
                        label="Download"
                        status="success"
                        wrapClassName="w-fit"
                        startIcon={
                          <Image src="/icons/solid-download.svg" alt="solid-download" width={20} height={20} />
                        }
                        onClick={downloadBillPayment}
                      />
                    </div>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default PaymentDetailModal;
