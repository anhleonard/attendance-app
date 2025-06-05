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
  student: Student;
  session: Session;
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
        // If attendance exists, use the data directly
        setIsExistingAttendance(true);
        setAttendanceData(attendanceResponse);
        setStudentsData({ total: 0, data: [] }); // Clear students data
        // Set checkedAll based on current attendance status
        const allAttended = attendanceResponse.data.every((record: AttendanceRecord) => record.isAttend);
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
        // If no attendance exists, fetch active students
        setIsExistingAttendance(false);
        const studentsResponse = await getStudents({
          classId: classId,
          status: Status.ACTIVE,
          page: page,
          rowPerPage: rowsPerPage,
        });
        setStudentsData(studentsResponse);
        setAttendanceData({
          statistic: { total: 0, attended: 0, absent: 0 },
          total: 0,
          page: 1,
          rowPerPage: 10,
          data: [],
        }); // Clear attendance data
        setCheckedAll(false); // Reset checkedAll for new attendance

        // Remove the class statistics update when fetching students
        // We'll only update statistics after saving attendance
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
    } else {
      setSelectedClassId(classId);
      setPage(1);
      setCheckedAll(false);
      setNotes({});
      if (classId) {
        fetchAttendanceOrStudents(classId);
      }
    }
  };

  const handleChangeCheckedAll = (value: boolean) => {
    setCheckedAll(value);
    if (isExistingAttendance) {
      // Update existing attendance records
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
    } else {
      // Update new attendance records
      const updatedStudents = studentsData.data.map((student) => ({
        ...student,
        isAttend: value,
      }));
      setStudentsData({
        ...studentsData,
        data: updatedStudents,
      });
    }
  };

  const handleChangeAttendanceChecked = (id: number, value: boolean) => {
    if (isExistingAttendance) {
      const updatedRecords = attendanceData.data.map((record) =>
        record.id === id ? { ...record, isAttend: value } : record,
      );
      const allChecked = updatedRecords.every((record) => record.isAttend);
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
      setCheckedAll(allChecked);
    } else {
      const updatedStudents = studentsData.data.map((student) =>
        student.id === id ? { ...student, isAttend: value } : student,
      );
      const allChecked = updatedStudents.every((student) => student.isAttend);

      setStudentsData({
        ...studentsData,
        data: updatedStudents,
      });
      setCheckedAll(allChecked);
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
            setAttendanceData(response);
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
            setStudentsData(response);
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
        // Update existing attendance
        const updateData: UpdateBatchAttendanceDto = {
          classId: selectedClassId,
          learningDate: moment(date, "DD-MM-YYYY").toDate(),
          attendances: attendanceData.data.map((record) => ({
            studentId: record.studentId,
            sessionId: record.sessionId,
            attendanceId: record.id,
            isAttend: record.isAttend,
            noteAttendance: notes[record.id] || record.noteAttendance || "",
          })),
        };

        await updateBatchAttendance(updateData);
      } else {
        // Create new attendance
        const createData: CreateAttendanceDto[] = studentsData.data.map((student) => ({
          studentId: student.id,
          sessionId: sessionId,
          isAttend: student.isAttend || false,
          noteAttendance: notes[student.id] || "",
          learningDate: moment(date, "DD-MM-YYYY").toDate(),
        }));

        await createBatchAttendance(createData);
      }

      // After successful save, update the class statistics
      const attendedCount = isExistingAttendance
        ? attendanceData.data.filter((record) => record.isAttend).length
        : studentsData.data.filter((student) => student.isAttend).length;
      const totalCount = isExistingAttendance ? attendanceData.statistic.total : studentsData.total;

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

      // Refresh the data
      if (selectedClassId) {
        fetchAttendanceOrStudents(selectedClassId);
      }
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
                          .sort((a, b) => a.student.name.localeCompare(b.student.name))
                          .map((record, index) => (
                            <tr key={record.id} className="hover:bg-primary-c10">
                              <th className="pl-3 py-4">{(page - 1) * rowsPerPage + index + 1}</th>
                              <th className="px-1 py-4">{record.student.name}</th>
                              <th className="px-1 py-4">{moment(record.learningDate).format("D/M/YYYY")}</th>
                              <th className="px-1 py-4">
                                <Checkbox
                                  isChecked={record.isAttend}
                                  onChange={(value: boolean) => handleChangeAttendanceChecked(record.id, value)}
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
                      {[...studentsData.data]
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((student, index) => (
                          <tr key={student.id} className="hover:bg-primary-c10">
                            <th className="pl-3 py-4">{index + 1}</th>
                            <th className="px-1 py-4">{student.name}</th>
                            <th className="px-1 py-4">{moment(date, "DD-MM-YYYY").format("D/M/YYYY")}</th>
                            <th className="px-1 py-4">
                              <Checkbox
                                isChecked={student.isAttend || false}
                                onChange={(value: boolean) => handleChangeAttendanceChecked(student.id, value)}
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
            <div className="flex items-center gap-8 justify-end mt-2">
              <Button label="Save" className="!py-2.5 !px-5" status="success" onClick={handleSaveAttendance} />
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
