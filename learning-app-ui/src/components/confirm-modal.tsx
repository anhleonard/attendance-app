"use client";
import React, { Fragment } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react";
import Image from "next/image";
import { closeConfirm } from "@/redux/slices/confirm-slice";
import Button from "@/lib/button";

const ConfirmModal = () => {
  const dispatch = useDispatch();
  const confirmData = useSelector((state: RootState) => state.confirm);

  const handleCloseModal = () => {
    dispatch(closeConfirm());
  };

  return (
    <Transition appear show={confirmData?.isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-[3999]" onClose={handleCloseModal}>
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
                className={`relative transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all w-full max-w-lg`}
              >
                <div className="relative flex-shrink-0 px-6 py-6 text-center">
                  <span className="absolute right-3 top-3">
                    <button
                      className="hover:bg-grey-c50 p-1.5 rounded-full active:bg-grey-c100 transition-transform duration-300"
                      onClick={handleCloseModal}
                    >
                      <Image src="/icons/close-icon.svg" alt="close-icon" width={20} height={20} />
                    </button>
                  </span>
                </div>
                <div className="w-full max-h-[75vh] overflow-auto px-20 text-sm">
                  <div className="flex flex-col items-center justify-center">
                    <Image src="/icons/warning-delete.svg" alt="warning-delete" width={40} height={40} />
                    <div className="font-bold text-xl text-grey-c900 mt-4 mb-2">{confirmData.title}</div>
                    <div className="font-medium text-sm text-grey-c300 text-center mb-4">{confirmData.subtitle}</div>
                    <div className="flex flex-col gap-3 w-full mb-8">
                      <Button
                        label={confirmData.titleAction}
                        wrapClassName="!w-full"
                        className="!w-full py-3.5"
                        status="error"
                        onClick={confirmData.handleAction}
                      />
                      <Button label="Cancel" className="!w-full py-3.5" status="cancel" onClick={handleCloseModal} />
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

export default ConfirmModal;
