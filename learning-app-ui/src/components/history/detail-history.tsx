import Image from "next/image";
import React from "react";
import HistoryPath from "./history-path";

const DetailHistoryModal = () => {
  return (
    <div className="flex flex-col gap-4">
      {/* 1. */}
      <div className="flex flex-col gap-1">
        <div className="font-semibold text-primary-c900">1. General information</div>
        <div className="py-2 px-4 flex flex-col gap-2">
          {/* 1. Name */}
          <div className="px-3 py-2.5 flex flex-row items-center justify-between bg-primary-c50 rounded-xl">
            <div className="flex flex-row items-center gap-2">
              <Image src="/icons/name-icon.svg" alt="name-icon" width={20} height={20} />
              <div className="text-grey-c900">Name</div>
            </div>
            <div className="text-grey-c700">Anh Leonard</div>
          </div>

          {/* 2. Joined at */}
          <div className="px-3 py-2.5 flex flex-row items-center justify-between bg-primary-c50 rounded-xl">
            <div className="flex flex-row items-center gap-2">
              <Image src="/icons/created-icon.svg" alt="created-icon" width={20} height={20} />
              <div className="text-grey-c900">Joined at</div>
            </div>
            <div className="text-grey-c700">07/01/2025</div>
          </div>

          {/* 2. Total sessions */}
          <div className="px-3 py-2.5 flex flex-row items-center justify-between bg-primary-c50 rounded-xl">
            <div className="flex flex-row items-center gap-2">
              <Image src="/icons/ring-icon.svg" alt="ring-icon" width={20} height={20} />
              <div className="text-grey-c900">Total sessions</div>
            </div>
            <div className="text-grey-c700">120</div>
          </div>

          {/* 2. Current class */}
          <div className="px-3 py-2.5 flex flex-row items-center justify-between bg-primary-c50 rounded-xl">
            <div className="flex flex-row items-center gap-2">
              <Image src="/icons/student-detail-icon.svg" alt="student-detail-icon" width={20} height={20} />
              <div className="text-grey-c900">Current class</div>
            </div>
            <div className="text-grey-c700">TLA Class</div>
          </div>
        </div>
      </div>

      {/* 2. */}
      <div className="flex flex-col gap-6">
        <div className="font-semibold text-primary-c900">2. History path</div>
        <HistoryPath />
      </div>
    </div>
  );
};

export default DetailHistoryModal;
