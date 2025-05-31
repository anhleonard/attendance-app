"use client";
import React, { Fragment } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { closeModal } from "@/redux/slices/modal-slice";
import Image from "next/image";

const Modal = () => {
  const dispatch = useDispatch();
  const modalData = useSelector((state: RootState) => state.modal);

  const handleCloseModal = () => {
    dispatch(closeModal());
  };

  return (
    <Transition appear show={modalData?.isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-[9999]" onClose={handleCloseModal}>
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
              <DialogPanel
                className={`relative transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all w-full ${
                  modalData.className || "max-w-3xl"
                }`}
              >
                <div className="relative flex-shrink-0 px-6 py-4 border-b border-neutral-200 text-center">
                  <DialogTitle className="text-lg leading-6 text-success-c800 font-semibold text-left">
                    {modalData.title}
                  </DialogTitle>
                  <span className="absolute right-3 top-3">
                    <button
                      className="hover:bg-grey-c50 p-1.5 rounded-full active:bg-grey-c100 transition-transform duration-300"
                      onClick={handleCloseModal}
                    >
                      <Image src="/icons/close-icon.svg" alt="close-icon" width={20} height={20} />
                    </button>
                  </span>
                </div>
                <div className="w-full max-h-[75vh] overflow-auto px-4 py-3 text-sm">{modalData?.content}</div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default Modal;
