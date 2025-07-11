// Refactored Attendance.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import moment from "moment";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";

import DatePicker from "@/lib/date-picker";
import Select from "@/lib/select";
import ExistingAttendance from "@/components/attendance/existing-attendance";
import NewAttendance from "@/components/attendance/new-attendance";
import ClassInfoTable from "@/components/attendance/class-info-table";
import { Status } from "@/config/enums";
import { getClasses } from "@/apis/services/classes";
import { getAttendances } from "@/apis/services/attendances";
import { FilterClassDto, FilterAttendanceDto } from "@/apis/dto";
import { openLoading, closeLoading } from "@/redux/slices/loading-slice";
import { AttendanceResponse, Session } from "@/config/types";

interface ClassResponse {
  id: number;
  name: string;
  description: string;
  sessions: Session[];
  status: Status;
  statistic?: {
    total: number;
    attended: number;
    absent: number;
  };
}

const Attendance: React.FC = () => {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();

  const [date, setDate] = useState<string>(moment().format("DD-MM-YYYY"));
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [classesInfo, setClassesInfo] = useState<ClassResponse[]>([]);
  const [isExistingAttendance, setIsExistingAttendance] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentClassInfo, setCurrentClassInfo] = useState<ClassResponse | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceResponse | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

  const classesFetchedRef = useRef<string>("");
  const attendanceCheckRef = useRef<string>("");

  useEffect(() => {
    const classIdParam = searchParams.get("classId");
    const dateParam = searchParams.get("date");
    const sessionIdParam = searchParams.get("sessionId");

    if (classIdParam && dateParam) {
      const classId = parseInt(classIdParam);
      setSelectedClassId(classId);
      setDate(dateParam);
      if (sessionIdParam) {
        setSelectedSessionId(parseInt(sessionIdParam));
      }
      setIsReady(true);
    } else {
      setIsReady(true);
      setIsLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isReady || !date) return;
    if (classesFetchedRef.current === date) return;

    fetchClassesForDate(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, isReady]);

  useEffect(() => {
    if (selectedClassId && classesInfo.length > 0 && !currentClassInfo) {
      const classInfo = classesInfo.find((c) => c.id === selectedClassId);
      if (classInfo) {
        setCurrentClassInfo(classInfo);
        // Check attendance only once for this class and date combination
        const checkKey = `${selectedClassId}-${date}`;
        if (attendanceCheckRef.current !== checkKey) {
          attendanceCheckRef.current = checkKey;
          checkAttendanceAndSet(selectedClassId);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, classesInfo, currentClassInfo, date]);

  useEffect(() => {
    if (isReady && classesInfo.length > 0 && !selectedClassId) {
      setIsLoading(false);
    }
  }, [isReady, classesInfo, selectedClassId]);

  const fetchClassesForDate = async (targetDate: string) => {
    try {
      dispatch(openLoading());

      const filter: FilterClassDto = {
        learningDate: moment(targetDate, "DD-MM-YYYY").toDate(),
        status: Status.ACTIVE,
        fetchAll: true,
        hasHistories: true,
      };

      const response = await getClasses(filter);
      setClassesInfo(response?.data || []);
      classesFetchedRef.current = targetDate;
    } finally {
      dispatch(closeLoading());
    }
  };

  const checkAttendanceAndSet = async (classId: number, learningDate = date) => {
    setIsLoading(true);
    try {
      // Call fetch-attendances once to check existence and get data
      const filter: FilterAttendanceDto = {
        classId,
        learningDate: moment(learningDate, "DD-MM-YYYY").toDate(),
        page: 1,
        rowPerPage: 10,
      };
      const response = await getAttendances(filter);

      const exists = response && response.data.length > 0;
      setIsExistingAttendance(exists);

      // If attendance exists, we can pass the data to ExistingAttendance component
      // to avoid calling the API again
      if (exists && response) {
        // Store the attendance data to pass to ExistingAttendance
        setAttendanceData(response);
      } else {
        // Reset attendance data if no attendance exists
        setAttendanceData(null);
      }
    } catch {
      setAttendanceData(null);
    } finally {
      setIsLoading(false);
      setIsReady(true);
    }
  };

  const handleChangeSelect = async (classId: number | null) => {
    if (selectedClassId === classId && classId !== null) {
      setSelectedClassId(null);
      setIsExistingAttendance(false);
      setCurrentClassInfo(null);
      attendanceCheckRef.current = ""; // Reset attendance check
      setAttendanceData(null); // Reset attendance data
      setSelectedSessionId(null); // Reset session ID
      return;
    }

    setSelectedClassId(classId);
    setSelectedSessionId(null); // Reset session ID when changing class
    if (classId) {
      const classInfo = classesInfo.find((c) => c.id === classId);
      if (classInfo) {
        setCurrentClassInfo(classInfo);
        // Check attendance only once for this class and date combination
        const checkKey = `${classId}-${date}`;
        if (attendanceCheckRef.current !== checkKey) {
          attendanceCheckRef.current = checkKey;
          await checkAttendanceAndSet(classId);
        }
      }
    } else {
      setCurrentClassInfo(null);
      attendanceCheckRef.current = ""; // Reset attendance check
      setAttendanceData(null); // Reset attendance data
    }
  };

  const handleDateChange = (value: string) => {
    setDate(value);
    setSelectedClassId(null);
    setIsExistingAttendance(false);
    setCurrentClassInfo(null);
    classesFetchedRef.current = "";
    attendanceCheckRef.current = ""; // Reset attendance check
    setAttendanceData(null); // Reset attendance data
    setSelectedSessionId(null); // Reset session ID
  };

  const handleUpdateStatistics = (statistics: { total: number; attended: number; absent: number }) => {
    if (currentClassInfo) {
      setCurrentClassInfo({
        ...currentClassInfo,
        statistic: statistics,
      });
    }
  };

  return (
    <div className="p-5">
      <div className="text-xl font-bold mb-6 flex items-center gap-2">
        <Image src="/icons/vertical-divide.svg" alt="|" width={2} height={20} />
        Attendance
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <DatePicker label="Select date" defaultDate={date} onChange={handleDateChange} />
        <Select
          label="Select class"
          options={classesInfo
            .filter((c) => c.sessions.some((session) => session.validTo === null))
            .map((c) => ({ label: c.name, value: c.id.toString() }))}
          defaultValue={selectedClassId?.toString() || ""}
          onChange={(val) => handleChangeSelect(val ? parseInt(val) : null)}
        />
      </div>

      {selectedClassId && !isLoading && currentClassInfo && (
        <>
          <ClassInfoTable
            classInfo={currentClassInfo}
            date={date}
            isExistingAttendance={isExistingAttendance}
            attendanceData={attendanceData}
            selectedSessionId={selectedSessionId}
          />

          <div className="font-bold text-base mb-3">2. Student list</div>

          {isExistingAttendance ? (
            <ExistingAttendance
              classId={selectedClassId}
              date={date}
              onSaveSuccess={() => {
                attendanceCheckRef.current = ""; // Reset to allow re-check
                checkAttendanceAndSet(selectedClassId);
              }}
              onUpdateStatistics={handleUpdateStatistics}
              initialAttendanceData={attendanceData as AttendanceResponse}
            />
          ) : (
            <NewAttendance
              classId={selectedClassId}
              date={date}
              sessionId={
                selectedSessionId || currentClassInfo.sessions.find((session) => session.validTo === null)?.id || 0
              }
              onSaveSuccess={() => {
                // Reset class selection after creating new attendance
                setSelectedClassId(null);
                setCurrentClassInfo(null);
                setIsExistingAttendance(false);
                attendanceCheckRef.current = "";
                setAttendanceData(null);
                setSelectedSessionId(null);
              }}
              onUpdateStatistics={handleUpdateStatistics}
            />
          )}
        </>
      )}

      {isLoading && (
        <div className="text-center py-4 w-full flex justify-center items-center">
          <Image src="/images/solid-loading.svg" alt="loading" width={28} height={28} className="animate-spin" />
        </div>
      )}
    </div>
  );
};

export default Attendance;
