import React from "react";
import Image from "next/image";
import HistoryPath from "./history-path";
import moment from "moment";

interface HistoryData {
  id: number;
  name: string;
  currentClass: {
    id: number;
    name: string;
    description: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    createdById: number;
    totalAttendances: number;
  };
  pastClasses: Array<{
    id: number;
    name: string;
    description: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    createdById: number;
    totalAttendances: number;
  }>;
}

interface Props {
  history: HistoryData;
}

const DetailHistoryModal: React.FC<Props> = ({ history }) => {
  // Calculate total sessions across all classes
  const totalSessions = history.currentClass.totalAttendances + 
    history.pastClasses.reduce((sum, pastClass) => sum + pastClass.totalAttendances, 0);

  return (
    <div className="flex flex-col gap-4">
      {/* 1. General information */}
      <div className="flex flex-col gap-1">
        <div className="font-semibold text-primary-c900">1. General information</div>
        <div className="py-2 px-4 flex flex-col gap-2">
          {/* 1. Name */}
          <div className="px-3 py-2.5 flex flex-row items-center justify-between bg-primary-c50 rounded-xl">
            <div className="flex flex-row items-center gap-2">
              <Image src="/icons/name-icon.svg" alt="name-icon" width={20} height={20} />
              <div className="text-grey-c900">Name</div>
            </div>
            <div className="text-grey-c700">{history.name}</div>
          </div>

          {/* 2. Joined at */}
          <div className="px-3 py-2.5 flex flex-row items-center justify-between bg-primary-c50 rounded-xl">
            <div className="flex flex-row items-center gap-2">
              <Image src="/icons/created-icon.svg" alt="created-icon" width={20} height={20} />
              <div className="text-grey-c900">Joined at</div>
            </div>
            <div className="text-grey-c700">{moment(history.currentClass.createdAt).format("DD/MM/YYYY")}</div>
          </div>

          {/* 3. Total sessions */}
          <div className="px-3 py-2.5 flex flex-row items-center justify-between bg-primary-c50 rounded-xl">
            <div className="flex flex-row items-center gap-2">
              <Image src="/icons/ring-icon.svg" alt="ring-icon" width={20} height={20} />
              <div className="text-grey-c900">Total joined</div>
            </div>
            <div className="text-grey-c700">{totalSessions}</div>
          </div>

          {/* 4. Current class */}
          <div className="px-3 py-2.5 flex flex-row items-center justify-between bg-primary-c50 rounded-xl">
            <div className="flex flex-row items-center gap-2">
              <Image src="/icons/student-detail-icon.svg" alt="student-detail-icon" width={20} height={20} />
              <div className="text-grey-c900">Current class</div>
            </div>
            <div className="text-grey-c700">{history.currentClass.name}</div>
          </div>
        </div>
      </div>

      {/* 2. History path */}
      <div className="flex flex-col gap-6">
        <div className="font-semibold text-primary-c900">2. History path</div>
        <HistoryPath 
          currentClass={history.currentClass}
          pastClasses={history.pastClasses}
        />
      </div>
    </div>
  );
};

export default DetailHistoryModal;
