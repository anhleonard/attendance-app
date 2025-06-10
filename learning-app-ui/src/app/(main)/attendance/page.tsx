"use client";
import Button from "@/lib/button";
import Checkbox from "@/lib/checkbox";
import DatePicker from "@/lib/date-picker";
import Pagination from "@/lib/pagination";
import Select from "@/lib/select";
import TextArea from "@/lib/textarea";
import moment from "moment";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { getClasses } from "@/apis/services/classes";
import { getAttendances, createBatchAttendance, updateBatchAttendance } from "@/apis/services/attendances";
import {
  FilterClassDto,
  CreateSessionDto,
  FilterAttendanceDto,
  CreateAttendanceDto,
  UpdateBatchAttendanceDto,
} from "@/apis/dto";
import { Status } from "@/config/enums";
import { getDayBySessionKey } from "@/config/functions";
import { useDispatch } from "react-redux";
import { openLoading, closeLoading } from "@/redux/slices/loading-slice";
import { openAlert } from "@/redux/slices/alert-slice";
import { getStudents } from "@/apis/services/students";
import { useSearchParams } from "next/navigation";

interface ClassResponse {
  id: number;
  name: string;
  description: string;
  sessions: CreateSessionDto[];
  status: Status;
  totalStudents?: number;
  attendance?: number;
  absence?: number;
  statistic?: {
    total: number;
    attended: number;
    absent: number;
  };
}

interface Student {
  id: number;
  name: string;
  status: Status;
  isAttend?: boolean;
}

interface Class {
  id: number;
  name: string;
}

interface Session {
  id: number;
  sessionKey: string;
  startTime: string;
  endTime: string;
  class: Class;
}

interface AttendanceRecord {
  id: number;
  isAttend: boolean;
  noteAttendance: string;
  learningDate: string;
  createdAt: string;
  updatedAt: string;
  studentId: number;
  sessionId: number;
  paymentId: number | null;
  createdById: number;
  updatedById: number | null;
  session: Session;
  student: Student;
}

interface AttendanceStatistic {
  total: number;
  attended: number;
  absent: number;
}

interface AttendanceResponse {
  statistic: AttendanceStatistic;
  total: number;
  page: number;
  rowPerPage: number;
  data: AttendanceRecord[];
}

interface StudentResponse {
  total: number;
  data: Student[];
}

const Attendance = () => {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const [date, setDate] = useState(moment().format("DD-MM-YYYY"));
  const [checkedAll, setCheckedAll] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [classesInfo, setClassesInfo] = useState<ClassResponse[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceResponse>({
    statistic: { total: 0, attended: 0, absent: 0 },
    total: 0,
    page: 1,
    rowPerPage: 10,
    data: [],
  });
  const [studentsData, setStudentsData] = useState<StudentResponse>({ total: 0, data: [] });
  const [isExistingAttendance, setIsExistingAttendance] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [notes, setNotes] = useState<{ [key: number]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [allItemsAttendance, setAllItemsAttendance] = useState<{ [key: number]: boolean }>({});
  const [selectKey, setSelectKey] = useState(0);

  // Handle URL parameters for navigation from calendar
  useEffect(() => {
    const classIdParam = searchParams.get('classId');
    const dateParam = searchParams.get('date');
    
    if (classIdParam && dateParam) {
      const classId = parseInt(classIdParam);
      setSelectedClassId(classId);
      setDate(dateParam);
    }
  }, [searchParams]);

  // Fetch attendance data when selectedClassId or date changes
  useEffect(() => {
    if (selectedClassId && date) {
      fetchAttendanceOrStudents(selectedClassId);
    }
  }, [selectedClassId, date]);

  // Update Select component value when classesInfo is loaded and selectedClassId is set
  useEffect(() => {
    if (classesInfo.length > 0 && selectedClassId) {
      // Force re-render Select component by updating the key
      setSelectKey(prev => prev + 1);
    }
  }, [classesInfo, selectedClassId]);

  const calculateDuration = (startTime: string, endTime: string): string => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffInHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return `${diffInHours} hours`;
  };

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        dispatch(openLoading());
        const filterData: FilterClassDto = {
          learningDate: moment(date, "DD-MM-YYYY").toDate(),
          status: Status.ACTIVE,
          fetchAll: true,
        };
        const response = await getClasses(filterData);
        setClassesInfo(response?.data || []);
      } catch (error) {
        console.error("Error fetching classes:", error);
      } finally {
        dispatch(closeLoading());
      }
    };

    fetchClasses();
  }, [date, dispatch]);

  const fetchAttendanceOrStudents = async (classId: number) => {
    try {
      // Fetch attendance data directly with full page size
      const filterData: FilterAttendanceDto = {
        classId: classId,
        learningDate: moment(date, "DD-MM-YYYY").toDate(),
        page: page,
        rowPerPage: rowsPerPage,
      };
      const attendanceResponse = await getAttendances(filterData);

      if (attendanceResponse && attendanceResponse.data.length > 0) {
        // If attendance exists, fetch all attendance records to initialize allItemsAttendance
        const allAttendanceResponse = await getAttendances({
          classId: classId,
          learningDate: moment(date, "DD-MM-YYYY").toDate(),
          page: 1,
          rowPerPage: 1000, // Fetch all records
        });

        setIsExistingAttendance(true);
        setAttendanceData(attendanceResponse);
        setStudentsData({ total: 0, data: [] }); // Clear students data

        // Initialize allItemsAttendance with all students' data
        const newAllItemsAttendance: { [key: number]: boolean } = {};
        if (allAttendanceResponse) {
          allAttendanceResponse.data.forEach((record: AttendanceRecord) => {
            newAllItemsAttendance[record.studentId] = record.isAttend;
          });
        }
        setAllItemsAttendance(newAllItemsAttendance);

        // Set checkedAll based on all items' status
        const allAttended = Object.values(newAllItemsAttendance).every((status) => status);
        setCheckedAll(allAttended);

        // Update class statistics only when there is existing attendance
        setClassesInfo((prevClasses) =>
          prevClasses.map((classInfo) =>
            classInfo.id === classId
              ? {
                  ...classInfo,
                  statistic: attendanceResponse.statistic,
                }
              : classInfo,
          ),
        );
      } else {
        // If no attendance exists, fetch all active students to initialize allItemsAttendance
        const allStudentsResponse = await getStudents({
          classId: classId,
          status: Status.ACTIVE,
          fetchAll: true,
        });

        // Fetch current page students for display
        const studentsResponse = await getStudents({
          classId: classId,
          status: Status.ACTIVE,
          page: page,
          rowPerPage: rowsPerPage,
        });

        setIsExistingAttendance(false);
        setStudentsData(studentsResponse);
        setAttendanceData({
          statistic: { total: 0, attended: 0, absent: 0 },
          total: 0,
          page: 1,
          rowPerPage: 10,
          data: [],
        }); // Clear attendance data

        // Initialize allItemsAttendance with all students' data
        const newAllItemsAttendance: { [key: number]: boolean } = {};
        if (allStudentsResponse) {
          allStudentsResponse.data.forEach((student: Student) => {
            newAllItemsAttendance[student.id] = false;
          });
        }
        setAllItemsAttendance(newAllItemsAttendance);

        setCheckedAll(false); // Reset checkedAll for new attendance
      }
    } catch (error) {
      dispatch(openAlert({ isOpen: true, title: "ERROR", subtitle: "Error fetching data", type: "error" }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeSelect = (classId: number | null) => {
    if (selectedClassId === classId) {
      setSelectedClassId(null);
      setAttendanceData({
        statistic: { total: 0, attended: 0, absent: 0 },
        total: 0,
        page: 1,
        rowPerPage: 10,
        data: [],
      });
      setStudentsData({ total: 0, data: [] });
      setPage(1);
      setCheckedAll(false);
      setNotes({});
      setAllItemsAttendance({});
    } else {
      setSelectedClassId(classId);
      setPage(1);
      setCheckedAll(false);
      setNotes({});
      setAllItemsAttendance({});
      if (classId) {
        fetchAttendanceOrStudents(classId);
      }
    }
  };

  const handleChangeCheckedAll = async (value: boolean) => {
    setCheckedAll(value);

    if (!selectedClassId) return;

    try {
      if (isExistingAttendance) {
        // Fetch all attendance records to update all students
        const allAttendanceResponse = await getAttendances({
          classId: selectedClassId,
          learningDate: moment(date, "DD-MM-YYYY").toDate(),
          page: 1,
          rowPerPage: 1000, // Fetch all records
        });

        if (allAttendanceResponse) {
          // Update allItemsAttendance with all students
          const updatedAllItemsAttendance: { [key: number]: boolean } = {};
          allAttendanceResponse.data.forEach((record: AttendanceRecord) => {
            updatedAllItemsAttendance[record.studentId] = value;
          });
          setAllItemsAttendance(updatedAllItemsAttendance);

          // Update current page data
          const updatedRecords = attendanceData.data.map((record) => ({
            ...record,
            isAttend: value,
          }));
          setAttendanceData({
            ...attendanceData,
            data: updatedRecords,
            statistic: {
              ...attendanceData.statistic,
              attended: value ? attendanceData.statistic.total : 0,
              absent: value ? 0 : attendanceData.statistic.total,
            },
          });
        }
      } else {
        // Fetch all students to update all students
        const allStudentsResponse = await getStudents({
          classId: selectedClassId,
          status: Status.ACTIVE,
          fetchAll: true,
        });

        if (allStudentsResponse) {
          // Update allItemsAttendance with all students
          const updatedAllItemsAttendance: { [key: number]: boolean } = {};
          allStudentsResponse.data.forEach((student: Student) => {
            updatedAllItemsAttendance[student.id] = value;
          });
          setAllItemsAttendance(updatedAllItemsAttendance);

          // Update current page data
          const updatedStudents = studentsData.data.map((student) => ({
            ...student,
            isAttend: value,
          }));
          setStudentsData({
            ...studentsData,
            data: updatedStudents,
          });
        }
      }
    } catch (error) {
      console.error("Error updating all attendance:", error);
      dispatch(openAlert({ isOpen: true, title: "ERROR", subtitle: "Error updating all attendance", type: "error" }));
    }
  };

  const handleChangeAttendanceChecked = (id: number, value: boolean, studentId: number) => {
    // Update the specific item in allItemsAttendance using studentId as key
    setAllItemsAttendance((prev) => ({
      ...prev,
      [studentId]: value,
    }));

    // Check if all items are now checked by comparing with total count
    const updatedAllItemsAttendance = { ...allItemsAttendance, [studentId]: value };
    const totalStudents = isExistingAttendance ? attendanceData.statistic.total : studentsData.total;
    const checkedCount = Object.values(updatedAllItemsAttendance).filter((status) => status).length;
    const allChecked = checkedCount === totalStudents && totalStudents > 0;
    setCheckedAll(allChecked);

    if (isExistingAttendance) {
      const updatedRecords = attendanceData.data.map((record) =>
        record.id === id ? { ...record, isAttend: value } : record,
      );
      const attendedCount = updatedRecords.filter((record) => record.isAttend).length;

      setAttendanceData({
        ...attendanceData,
        data: updatedRecords,
        statistic: {
          ...attendanceData.statistic,
          attended: attendedCount,
          absent: attendanceData.statistic.total - attendedCount,
        },
      });
    } else {
      const updatedStudents = studentsData.data.map((student) =>
        student.id === id ? { ...student, isAttend: value } : student,
      );

      setStudentsData({
        ...studentsData,
        data: updatedStudents,
      });
    }
  };

  const handlePageChange = (newPage: number, newRowsPerPage: number) => {
    const shouldResetPage = newRowsPerPage !== rowsPerPage;
    if (shouldResetPage) {
      setRowsPerPage(newRowsPerPage);
      setPage(1);
    } else {
      setPage(newPage);
    }

    if (selectedClassId) {
      // Use the new values for the API call
      const currentPage = shouldResetPage ? 1 : newPage;
      const currentRowsPerPage = newRowsPerPage;

      if (isExistingAttendance) {
        const filterData: FilterAttendanceDto = {
          classId: selectedClassId,
          learningDate: moment(date, "DD-MM-YYYY").toDate(),
          page: currentPage,
          rowPerPage: currentRowsPerPage,
        };
        getAttendances(filterData)
          .then((response) => {
            // Update attendance data while preserving allItemsAttendance
            setAttendanceData(response);
            // Don't update allItemsAttendance here as it should contain all students
          })
          .catch((error) => {
            dispatch(
              openAlert({ isOpen: true, title: "ERROR", subtitle: "Error fetching attendance data", type: "error" }),
            );
          });
      } else {
        getStudents({
          classId: selectedClassId,
          status: Status.ACTIVE,
          page: currentPage,
          rowPerPage: currentRowsPerPage,
        })
          .then((response) => {
            // Update students data while preserving allItemsAttendance
            setStudentsData(response);
            // Don't update allItemsAttendance here as it should contain all students
          })
          .catch((error) => {
            dispatch(
              openAlert({ isOpen: true, title: "ERROR", subtitle: "Error fetching students data", type: "error" }),
            );
          });
      }
    }
  };

  const handleNoteChange = (recordId: number, note: string) => {
    setNotes((prev) => ({
      ...prev,
      [recordId]: note,
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedClassId) {
      dispatch(openAlert({ isOpen: true, title: "ERROR", subtitle: "Please select a class first", type: "error" }));
      return;
    }

    try {
      dispatch(openLoading());
      const selectedClass = classesInfo.find((c) => c.id === selectedClassId);

      if (!selectedClass) {
        throw new Error("Class information not found");
      }

      const sessionId = selectedClass.sessions?.[0]?.id;
      if (!sessionId) {
        throw new Error("Session information not found");
      }

      if (isExistingAttendance) {
        // Update existing attendance - fetch all attendance records first
        const allAttendanceResponse = await getAttendances({
          classId: selectedClassId,
          learningDate: moment(date, "DD-MM-YYYY").toDate(),
          page: 1,
          rowPerPage: 1000, // Fetch all records
        });

        if (!allAttendanceResponse) {
          throw new Error("Failed to fetch all attendance records");
        }

        // Update existing attendance with all items' data
        const updateData: UpdateBatchAttendanceDto = {
          classId: selectedClassId,
          learningDate: moment(date, "DD-MM-YYYY").toDate(),
          attendances: allAttendanceResponse.data.map((record: AttendanceRecord) => ({
            studentId: record.studentId,
            sessionId: record.sessionId,
            attendanceId: record.id,
            isAttend: allItemsAttendance[record.studentId] ?? record.isAttend,
            noteAttendance: notes[record.id] || record.noteAttendance || "",
          })),
        };

        await updateBatchAttendance(updateData);
      } else {
        // Create new attendance - fetch all students first
        const allStudentsResponse = await getStudents({
          classId: selectedClassId,
          status: Status.ACTIVE,
          fetchAll: true,
        });

        if (!allStudentsResponse) {
          throw new Error("Failed to fetch all students");
        }

        // Create new attendance with all students' data
        const createData: CreateAttendanceDto[] = allStudentsResponse.data.map((student: Student) => ({
          studentId: student.id,
          sessionId: sessionId,
          isAttend: allItemsAttendance[student.id] ?? false,
          noteAttendance: notes[student.id] || "",
          learningDate: moment(date, "DD-MM-YYYY").toDate(),
        }));

        await createBatchAttendance(createData);
      }

      // After successful save, update the class statistics
      const totalCount = isExistingAttendance ? attendanceData.statistic.total : studentsData.total;
      const attendedCount = Object.values(allItemsAttendance).filter((status) => status).length;

      setClassesInfo((prevClasses) =>
        prevClasses.map((classInfo) =>
          classInfo.id === selectedClassId
            ? {
                ...classInfo,
                statistic: {
                  total: totalCount,
                  attended: attendedCount,
                  absent: totalCount - attendedCount,
                },
              }
            : classInfo,
        ),
      );

      dispatch(
        openAlert({ isOpen: true, title: "SUCCESS", subtitle: "Attendance saved successfully", type: "success" }),
      );

      // Reset all states except learningDate after successful save
      setSelectedClassId(null);
      setCheckedAll(false);
      setNotes({});
      setPage(1);
      setRowsPerPage(10);
      setAllItemsAttendance({});
      setIsExistingAttendance(false);
      setIsLoading(false);
      setAttendanceData({
        statistic: { total: 0, attended: 0, absent: 0 },
        total: 0,
        page: 1,
        rowPerPage: 10,
        data: [],
      });
      setStudentsData({ total: 0, data: [] });
    } catch (error: any) {
      console.error("Attendance save error:", error);
      dispatch(
        openAlert({
          isOpen: true,
          title: "ERROR",
          subtitle: error.message || "Failed to save attendance",
          type: "error",
        }),
      );
    } finally {
      dispatch(closeLoading());
    }
  };

  const handleDateChange = (value: string) => {
    setDate(value);
    // Reset all states when date changes
    setSelectedClassId(null);
    setCheckedAll(false);
    setNotes({});
    setPage(1);
    setAllItemsAttendance({});
    setAttendanceData({
      statistic: { total: 0, attended: 0, absent: 0 },
      total: 0,
      page: 1,
      rowPerPage: 10,
      data: [],
    });
    setStudentsData({ total: 0, data: [] });
  };

  const handleCancel = () => {
    // Reset date to today
    setDate(moment().format("DD-MM-YYYY"));
    // Clear selected class and reset states
    setSelectedClassId(null);
    setCheckedAll(false);
    setNotes({});
    setPage(1);
    setAllItemsAttendance({});
    setAttendanceData({
      statistic: { total: 0, attended: 0, absent: 0 },
      total: 0,
      page: 1,
      rowPerPage: 10,
      data: [],
    });
    setStudentsData({ total: 0, data: [] });
  };

  return (
    <div className="p-5">
      <div className="flex flex-row items-center gap-2 mb-8">
        <Image src="/icons/vertical-divide.svg" alt="vertical-divide" width={2} height={20} />
        <div className="text-xl font-bold">Attendance</div>
      </div>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col">
          <div className="font-bold text-base">1. Information</div>

          {/* filter class */}
          <div className="grid grid-cols-4 gap-3 mb-6 mt-4">
            <DatePicker onChange={handleDateChange} defaultDate={date} label="Select date" />
            <Select
              label="Select class"
              options={[
                ...classesInfo.map((classInfo) => ({
                  label: classInfo.name,
                  value: classInfo.id.toString(),
                })),
              ]}
              defaultValue={selectedClassId?.toString() || ""}
              onChange={(value: string) => {
                const classId = value ? parseInt(value) : null;
                handleChangeSelect(classId);
              }}
              key={selectKey}
            />
            <div className="flex flex-row gap-3">
              <Button label="Cancel" className="py-[13px] px-8" status="cancel" onClick={handleCancel} />
            </div>
          </div>

          {/* table 1 */}
          <div className="max-w-[100%] rounded-[10px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-auto w-full text-left">
                <thead className={`text-grey-c700 uppercase bg-primary-c50`}>
                  <tr className="hover:bg-success-c50 hover:text-grey-c700 font-bold">
                    <th className="pl-3 py-4">Class</th>
                    <th className="px-1 py-4">Day</th>
                    <th className="px-1 py-4">Time start</th>
                    <th className="px-1 py-4">Time end</th>
                    <th className="px-1 py-4">Study time</th>
                    <th className="px-1 py-4">Total students</th>
                    <th className="px-1 py-4">Attendance</th>
                    <th className="px-1 py-4">Absence</th>
                    <th className="px-1 py-4 text-center">Selected</th>
                  </tr>
                </thead>
                <tbody>
                  {classesInfo?.map((classInfo) => (
                    <tr key={classInfo.id} className="hover:bg-primary-c10 hover:text-grey-c700">
                      <th className="pl-3 py-4">{classInfo.name}</th>
                      <th className="px-1 py-4">
                        {getDayBySessionKey(classInfo.sessions[0]?.sessionKey)?.charAt(0) +
                          getDayBySessionKey(classInfo.sessions[0]?.sessionKey)?.slice(1).toLowerCase()}
                      </th>
                      <th className="px-1 py-4">{classInfo.sessions[0]?.startTime}</th>
                      <th className="px-1 py-4">{classInfo.sessions[0]?.endTime}</th>
                      <th className="px-1 py-4">
                        {classInfo.sessions[0]?.startTime && classInfo.sessions[0]?.endTime
                          ? calculateDuration(classInfo.sessions[0].startTime, classInfo.sessions[0].endTime)
                          : "0 hours"}
                      </th>
                      <th className="px-1 py-4">{classInfo.statistic?.total || "--"}</th>
                      <th className="px-1 py-4">{classInfo.statistic?.attended || "--"}</th>
                      <th className="px-1 py-4">{classInfo.statistic?.absent || "--"}</th>
                      <th className="px-1 py-4 text-center">
                        <Checkbox
                          isChecked={selectedClassId === classInfo.id}
                          onChange={() => handleChangeSelect(classInfo.id)}
                        />
                      </th>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {selectedClassId && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-row items-center justify-between">
              <div className="font-bold text-base">2. Students</div>
              <div className="flex flex-row items-center gap-2">
                <Checkbox isChecked={checkedAll} onChange={handleChangeCheckedAll} />
                <div>All</div>
              </div>
            </div>
            {/* table 2 */}
            <div className="max-w-[100%] rounded-[10px] overflow-hidden">
              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="text-center py-4 w-full flex justify-center items-center">
                    <Image
                      src="/images/solid-loading.svg"
                      alt="solid-loading"
                      width={28}
                      height={28}
                      className="animate-spin"
                    />
                  </div>
                ) : isExistingAttendance ? (
                  attendanceData.data.length === 0 ? (
                    <div className="text-center py-4">No attendance records found</div>
                  ) : (
                    <table className="table-auto w-full text-left">
                      <thead className={`text-grey-c700 uppercase bg-primary-c50 font-bold`}>
                        <tr className="hover:bg-success-c50 hover:text-grey-c700">
                          <th className="pl-3 py-4">STT</th>
                          <th className="px-1 py-4">Name</th>
                          <th className="px-1 py-4">Date</th>
                          <th className="px-1 py-4">Status</th>
                          <th className="px-1 py-4">Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...attendanceData.data]
                          .map((record, index) => (
                            <tr key={record.id} className="hover:bg-primary-c10">
                              <th className="pl-3 py-4">{(page - 1) * rowsPerPage + index + 1}</th>
                              <th className="px-1 py-4">{record.student.name}</th>
                              <th className="px-1 py-4">{moment(record.learningDate).format("D/M/YYYY")}</th>
                              <th className="px-1 py-4">
                                <Checkbox
                                  isChecked={allItemsAttendance[record.studentId] ?? record.isAttend}
                                  onChange={(value: boolean) =>
                                    handleChangeAttendanceChecked(record.id, value, record.studentId)
                                  }
                                />
                              </th>
                              <th className="px-1 py-4">
                                <TextArea
                                  rows={2}
                                  label="Note of this student"
                                  inputClassName="font-questrial"
                                  value={notes[record.id] || record.noteAttendance || ""}
                                  onChange={(value: string) => handleNoteChange(record.id, value)}
                                />
                              </th>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )
                ) : studentsData.data.length === 0 ? (
                  <div className="text-center py-4">No students found</div>
                ) : (
                  <table className="table-auto w-full text-left">
                    <thead className={`text-grey-c700 uppercase bg-primary-c50 font-bold`}>
                      <tr className="hover:bg-success-c50 hover:text-grey-c700">
                        <th className="pl-3 py-4">STT</th>
                        <th className="px-1 py-4">Name</th>
                        <th className="px-1 py-4">Date</th>
                        <th className="px-1 py-4">Status</th>
                        <th className="px-1 py-4">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...studentsData.data].map((student, index) => (
                        <tr key={student.id} className="hover:bg-primary-c10">
                          <th className="pl-3 py-4">{index + 1}</th>
                          <th className="px-1 py-4">{student.name}</th>
                          <th className="px-1 py-4">{moment(date, "DD-MM-YYYY").format("D/M/YYYY")}</th>
                          <th className="px-1 py-4">
                            <Checkbox
                              isChecked={allItemsAttendance[student.id] ?? false}
                              onChange={(value: boolean) =>
                                handleChangeAttendanceChecked(student.id, value, student.id)
                              }
                            />
                          </th>
                          <th className="px-1 py-4">
                            <TextArea
                              rows={2}
                              label="Note of this student"
                              inputClassName="font-questrial"
                              value={notes[student.id] || ""}
                              onChange={(value: string) => handleNoteChange(student.id, value)}
                            />
                          </th>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            {/* end table */}
            <div className="flex items-center justify-between mt-2">
              <Button label="Save" className="!py-2.5 !px-8" status="success" onClick={handleSaveAttendance} />
              <Pagination
                totalItems={isExistingAttendance ? attendanceData.total : studentsData.total}
                rowsEachPage={rowsPerPage}
                nowPage={page}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
