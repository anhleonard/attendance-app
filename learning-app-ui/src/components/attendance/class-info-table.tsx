"use client";
import React from "react";
import moment from "moment";
import Image from "next/image";
import { getDayBySessionKey } from "@/config/functions";

interface Session {
  id: number;
  sessionKey: string;
  startTime: string;
  endTime: string;
  amount: number;
  status: string;
  validTo: string | null;
}

interface ClassInfo {
  id: number;
  name: string;
  description: string;
  sessions: Session[];
  status: string;
  statistic?: {
    total: number;
    attended: number;
    absent: number;
  };
}

interface AttendanceResponse {
  statistic: {
    total: number;
    attended: number;
    absent: number;
  };
  total: number;
  page: number;
  rowPerPage: number;
  data: any[];
}

interface ClassInfoTableProps {
  classInfo: ClassInfo | null;
  date: string;
  isExistingAttendance: boolean;
  attendanceData?: AttendanceResponse | null;
  selectedSessionId?: number | null;
}

const ClassInfoTable: React.FC<ClassInfoTableProps> = ({
  classInfo,
  date,
  isExistingAttendance,
  attendanceData,
  selectedSessionId,
}) => {
  if (!classInfo) return null;

  const calculateDuration = (startTime: string, endTime: string): string => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffInMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;

    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  };

  const getCurrentSession = () => {
    // If sessionId is provided (from calendar), use that specific session
    if (selectedSessionId) {
      return classInfo.sessions.find((session) => session.id === selectedSessionId);
    }

    // Otherwise, find the session for the current day with validTo === null
    const currentDay = moment(date, "DD-MM-YYYY").format("dddd").toUpperCase();
    return classInfo.sessions.find((session) => {
      const sessionDay = getDayBySessionKey(session.sessionKey as any);
      return sessionDay === currentDay && session.validTo === null;
    });
  };

  const currentSession = getCurrentSession();

  // Use attendanceData.statistic if available, otherwise fall back to classInfo.statistic
  const statistics = attendanceData?.statistic || classInfo.statistic;

  return (
    <div className="mb-6">
      <div className="font-bold text-base mb-3">1. General information</div>
      <div className="max-w-[100%] rounded-[10px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-auto w-full text-left">
            <thead className="text-grey-c700 uppercase bg-primary-c50 font-bold">
              <tr className="hover:bg-success-c50 hover:text-grey-c700">
                <th className="pl-3 py-4">Name</th>
                <th className="px-1 py-4">Date</th>
                <th className="px-1 py-4">Day</th>
                <th className="px-1 py-4">Start time</th>
                <th className="px-1 py-4">End time</th>
                <th className="px-1 py-4">Duration</th>
                <th className="px-1 py-4">Total students</th>
                {isExistingAttendance && (
                  <>
                    <th className="px-1 py-4">Present</th>
                    <th className="px-1 py-4">Absent</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-primary-c10">
                <td className="pl-3 py-4 font-medium">{classInfo.name}</td>
                <td className="px-1 py-4">{moment(date, "DD-MM-YYYY").format("DD/MM/YYYY")}</td>
                <td className="px-1 py-4">
                  {currentSession ? getDayBySessionKey(currentSession.sessionKey as any) : "No session"}
                </td>
                <td className="px-1 py-4">{currentSession ? currentSession.startTime : "-"}</td>
                <td className="px-1 py-4">{currentSession ? currentSession.endTime : "-"}</td>
                <td className="px-1 py-4">
                  {currentSession ? calculateDuration(currentSession.startTime, currentSession.endTime) : "-"}
                </td>
                <td className="px-1 py-4">
                  {statistics?.total !== undefined && statistics.total !== null ? statistics.total : "--"}
                </td>
                {isExistingAttendance && (
                  <>
                    <td className="px-1 py-4 font-medium">
                      {statistics?.attended !== undefined && statistics.attended !== null ? statistics.attended : "--"}
                    </td>
                    <td className="px-1 py-4 font-medium">
                      {statistics?.absent !== undefined && statistics.absent !== null ? statistics.absent : "--"}
                    </td>
                  </>
                )}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClassInfoTable;
