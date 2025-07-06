"use client";
import { Class, Session } from "@/config/types";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import moment from "moment";
import { getCalendar } from "@/apis/services/classes";
import { FilterCalendarDto } from "@/apis/dto";
import { openLoading, closeLoading } from "@/redux/slices/loading-slice";
import { openAlert } from "@/redux/slices/alert-slice";
import { useRouter } from "next/navigation";

// Update interfaces to match backend response
interface CalendarClass extends Class {
  sessions: Session[];
}

interface CalendarResponse {
  [key: string]: CalendarClass[]; // Format: "DD.MM.YYYY": CalendarClass[]
}

const CalendarPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(moment());
  const [calendarData, setCalendarData] = useState<CalendarResponse>({});
  const [calendarDays, setCalendarDays] = useState<
    Array<{
      day: number;
      weekday: string;
      date: string;
    }>
  >([]);

  // Fetch calendar data when month/year changes
  useEffect(() => {
    const fetchCalendarData = async () => {
      try {
        dispatch(openLoading());
        const filterData: FilterCalendarDto = {
          month: currentDate.month() + 1, // moment months are 0-based
          year: currentDate.year(),
        };
        const response = await getCalendar(filterData);
        setCalendarData(response || {});
      } catch (error: any) {
        dispatch(
          openAlert({
            isOpen: true,
            title: "ERROR",
            subtitle: error?.message || "Failed to fetch calendar data",
            type: "error",
          }),
        );
      } finally {
        dispatch(closeLoading());
      }
    };

    fetchCalendarData();
  }, [currentDate, dispatch]);

  const getAllDaysInMonth = (month: number, year: number) => {
    const totalDays = new Date(year, month, 0).getDate();
    return Array.from({ length: totalDays }, (_, i) => {
      const date = new Date(year, month - 1, i + 1);
      return {
        day: i + 1,
        weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
        date: moment(date).format("DD-MM-YYYY"),
      };
    });
  };

  const getDaysWithWeekdayOffset = (month: number, year: number) => {
    const days = getAllDaysInMonth(month, year);
    const firstDay = new Date(year, month - 1, 1);
    const firstDayWeekday = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Add empty cells for days before the first day of the month
    const emptyCells = Array(firstDayWeekday).fill(null);

    return [...emptyCells, ...days];
  };

  useEffect(() => {
    const days = getDaysWithWeekdayOffset(currentDate.month() + 1, currentDate.year());
    // Always fill to 42 cells (6 rows x 7 columns)
    const paddedDays = [...days];
    while (paddedDays.length < 42) {
      paddedDays.push(null);
    }
    setCalendarDays(paddedDays);
  }, [currentDate]);

  const handlePreviousMonth = () => {
    setCurrentDate(moment(currentDate).subtract(1, "month"));
  };

  const handleNextMonth = () => {
    setCurrentDate(moment(currentDate).add(1, "month"));
  };

  const handleClassClick = (classId: number, date: string, sessionId: number) => {
    // Navigate to attendance page with class ID, date, and session ID parameters
    const attendanceUrl = `/attendance?classId=${classId}&date=${date}&sessionId=${sessionId}`;
    router.push(attendanceUrl);
  };

  const renderDayCell = (day: (typeof calendarDays)[0] | null) => {
    if (!day) {
      return <div className="aspect-square p-2 bg-grey-c50" />;
    }

    // Convert date format from DD-MM-YYYY to DD.MM.YYYY to match backend format
    const backendDateKey = day.date.replace(/-/g, ".");
    const allClasses = calendarData[backendDateKey] || [];
    const today = moment();
    const isToday = backendDateKey === today.format("DD.MM.YYYY");

    // Filter classes based on createdAt date - only show classes created on or before the current date
    const classes = allClasses.filter((classItem) => {
      const classCreatedAt = moment(classItem.createdAt);
      return classCreatedAt.isSameOrBefore(today, "day");
    });

    const getClassStyle = (session: Session, sessionDate: string) => {
      const isPastDate = moment(sessionDate, "DD.MM.YYYY").isBefore(moment(), "day");

      if (session.hasAttendance) {
        // Đã điểm danh + validTo = null: màu xanh lá
        if (!session.validTo) {
          return "bg-success-c100 text-success-c800 hover:bg-success-c200";
        }
        // Đã điểm danh + validTo !== null: màu vàng cam
        else {
          return "bg-secondary-c50 text-secondary-c800 hover:bg-secondary-c100/95";
        }
      } else if (isPastDate) {
        // Quá hạn điểm danh: màu đỏ
        return "bg-support-c50/50 text-support-c700 hover:bg-support-c100/60";
      }
      // Chưa điểm danh: xanh blue
      return "bg-primary-c100 text-primary-c900 hover:bg-primary-c200";
    };

    const getTimeStyle = (session: Session, sessionDate: string) => {
      const isPastDate = moment(sessionDate, "DD.MM.YYYY").isBefore(moment(), "day");

      if (session.hasAttendance) {
        // Đã điểm danh + validTo = null: màu xanh lá
        if (session.validTo === null) {
          return "text-success-c600";
        }
        // Đã điểm danh + validTo !== null: màu vàng cam
        else {
          return "text-secondary-c700";
        }
      } else if (isPastDate) {
        // Quá hạn điểm danh: màu đỏ
        return "text-support-c300";
      }
      // Chưa điểm danh: xanh blue
      return "text-primary-c700";
    };

    return (
      <div className={`aspect-square p-2 bg-white relative`}>
        <div
          className={`mb-1 ${
            isToday
              ? "bg-primary-c800 text-sm text-white font-black rounded-lg px-1 w-fit"
              : "text-grey-c900 text-sm font-medium"
          }`}
        >
          {day.day}
        </div>
        <div className="space-y-1 h-[calc(100%-28px)] overflow-y-auto custom-scrollbar">
          {classes.map((classItem) => {
            const session = classItem.sessions[0]; // Get first session for display
            if (!session) return null;

            return (
              <div
                key={classItem.id}
                className={`text-xs p-1.5 rounded transition-colors cursor-pointer ${getClassStyle(
                  session,
                  backendDateKey,
                )}`}
                title={`${classItem.name} - ${session.startTime} - ${session.endTime} (${
                  session.hasAttendance
                    ? session.validTo === null
                      ? "Đã điểm danh (Đang học)"
                      : "Đã điểm danh (Lịch này đã chuyển)"
                    : "Chưa điểm danh"
                })`}
                onClick={() => handleClassClick(classItem.id, day.date, session.id)}
              >
                <div className="font-medium truncate">{classItem.name}</div>
                <div className={`text-[10px] truncate ${getTimeStyle(session, backendDateKey)}`}>
                  {session.startTime} - {session.endTime}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-5">
      <div className="flex flex-row items-center gap-2 mb-8">
        <Image src="/icons/vertical-divide.svg" alt="vertical-divide" width={2} height={20} />
        <div className="text-xl font-bold">Calendar</div>
      </div>
      <div className="flex flex-col">
        <div className="font-bold text-base mb-4">1. Calendar</div>

        {/* Calendar Grid */}
        <div className="border border-grey-c200 rounded-lg overflow-hidden">
          {/* Calendar Header with Navigation */}
          <div className="flex items-center justify-between p-4 bg-white border-b border-grey-c200">
            <button onClick={handlePreviousMonth} className="p-2 hover:bg-grey-c100 rounded-full transition-colors">
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <div className="text-lg font-semibold">{currentDate.format("MMMM YYYY")}</div>
            <button onClick={handleNextMonth} className="p-2 hover:bg-grey-c100 rounded-full transition-colors">
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          {/* Weekday Header */}
          <div className="grid grid-cols-7 bg-white">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
              <div
                key={day}
                className={`p-2 text-center text-sm font-medium text-grey-c700 border-b border-r border-grey-c200 ${
                  index === 6 ? "border-r-0" : ""
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              const isLastRow = index >= calendarDays.length - 7;
              const isLastColumn = index % 7 === 6;

              return (
                <div
                  key={index}
                  className={`border-b border-r border-grey-c200 ${isLastColumn ? "border-r-0" : ""} ${
                    isLastRow ? "border-b-0" : ""
                  }`}
                >
                  {renderDayCell(day)}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default CalendarPage;
