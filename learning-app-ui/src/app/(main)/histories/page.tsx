"use client";
import DetailHistoryModal from "@/components/history/detail-history";
import { ConfirmState, ModalState } from "@/config/types";
import Label from "@/lib/label";
import Pagination from "@/lib/pagination";
import Select from "@/lib/select";
import { openConfirm } from "@/redux/slices/confirm-slice";
import { openModal } from "@/redux/slices/modal-slice";
import Image from "next/image";
import React from "react";
import { useDispatch } from "react-redux";
import { Tooltip } from "react-tooltip";

const Histories = () => {
  const dispatch = useDispatch();

  const handleOpenViewModal = () => {
    const modal: ModalState = {
      isOpen: true,
      title: "History detail",
      content: <DetailHistoryModal />,
      className: "max-w-lg",
    };

    dispatch(openModal(modal));
  };

  const handleOpenConfirmDelete = () => {
    const confirm: ConfirmState = {
      isOpen: true,
      title: "Are you sure?",
      subtitle: "This action cannot be undone. All values associated in this student will be lost.",
      titleAction: "Delete",
      handleAction: () => {},
    };

    dispatch(openConfirm(confirm));
  };

  return (
    <div className="p-5">
      <div className="flex flex-row items-center gap-2 mb-8">
        <Image src="/icons/vertical-divide.svg" alt="vertical-divide" width={2} height={20} />
        <div className="text-xl font-bold">Histories</div>
      </div>
      <div className="flex flex-col">
        <div className="font-bold text-base">1. History list</div>

        {/* filter class */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 mb-5 mt-4">
          <Select
            label="Select student"
            options={[
              { label: "Anh Leonard", value: "MMA" },
              { label: "Norbu Wangmo", value: "TLA" },
            ]}
            defaultValue="MMA"
          />
          <Select
            label="Select current class"
            options={[
              { label: "MMA Class", value: "MMA_CLASS" },
              { label: "TLA Class", value: "TLA_CLASS" },
            ]}
            defaultValue="MMA_CLASS"
          />
        </div>

        {/* table 1 */}
        <div className="max-w-[100%] rounded-[10px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-auto w-full text-left">
              <thead className={`text-grey-c700 uppercase bg-primary-c50`}>
                <tr className="hover:bg-success-c50 hover:text-grey-c700 font-bold">
                  <th className="pl-3 py-4">STT</th>
                  <th className="px-1 py-4">Name</th>
                  <th className="px-1 py-4">Date of birth</th>
                  <th className="px-1 py-4">Current class</th>
                  <th className="px-1 py-4">Past class</th>
                  <th className="px-1 py-4">Total sessions</th>
                  <th className="px-1 py-4">Status</th>
                  <th className="px-1 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-primary-c10">
                  <th className="pl-3 py-4">1</th>
                  <th className="px-1 py-4 font-questrial text-grey-c900 text-[15px]">Trần Thị Anh</th>
                  <th className="px-1 py-4">20/02/2002</th>
                  <th className="px-1 py-4">MMA Class</th>
                  <th className="px-1 py-4">--</th>
                  <th className="px-1 py-4">12</th>
                  <th className="px-1 py-4">
                    <Label status="success" label="ACTIVE" />
                  </th>
                  <th className="px-1 py-4 text-center">
                    <div className="flex justify-center items-center gap-3">
                      <button
                        onClick={handleOpenViewModal}
                        title="View"
                        data-tooltip-id="view-icon"
                        data-tooltip-content="View"
                      >
                        <Image src="/icons/detail-icon.svg" alt="view-icon" width={24} height={24} />
                      </button>
                      <Tooltip id="view-icon" />

                      <button
                        onClick={handleOpenConfirmDelete}
                        data-tooltip-id="delete-icon"
                        data-tooltip-content="Delete"
                      >
                        <Image src="/icons/delete-icon.svg" alt="delete-icon" width={24} height={24} />
                      </button>
                      <Tooltip id="delete-icon" />
                    </div>
                  </th>
                </tr>
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
    </div>
  );
};

export default Histories;
