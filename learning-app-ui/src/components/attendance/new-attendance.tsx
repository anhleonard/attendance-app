"use client";
import Button from "@/lib/button";
import Checkbox from "@/lib/checkbox";
import Pagination from "@/lib/pagination";
import TextArea from "@/lib/textarea";
import moment from "moment";
import React, { useState, useEffect } from "react";
import { getStudents } from "@/apis/services/students";
import { createBatchAttendance } from "@/apis/services/attendances";
import { CreateBatchAttendanceDto } from "@/apis/dto";
import { Status } from "@/config/enums";
import { useDispatch } from "react-redux";
import { openLoading, closeLoading } from "@/redux/slices/loading-slice";
import { openAlert } from "@/redux/slices/alert-slice";

interface Student {
  id: number;
  name: string;
  status: Status;
  isAttend?: boolean;
  note?: string;
}

interface StudentResponse {
  total: number;
  data: Student[];
}

interface NewAttendanceProps {
  classId: number;
  date: string;
  sessionId: number;
  onSaveSuccess: () => void;
  onUpdateStatistics: (statistics: { total: number; attended: number; absent: number }) => void;
}

const NewAttendance: React.FC<NewAttendanceProps> = ({
  classId,
  date,
  sessionId,
  onSaveSuccess,
  onUpdateStatistics,
}) => {
  const dispatch = useDispatch();
  const [studentsData, setStudentsData] = useState<StudentResponse>({ total: 0, data: [] });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  // Selection state
  const [unselectedStudentIds, setUnselectedStudentIds] = useState<number[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [isSelectedAll, setIsSelectedAll] = useState(false);

  // Store original server data for comparison
  const [originalServerData, setOriginalServerData] = useState<{
    [key: number]: { isAttend: boolean; noteAttendance: string };
  }>({});

  const fetchStudentsData = async () => {
    if (!date) return;

    try {
      setIsLoading(true);
      const response = await getStudents({
        classId: classId,
        status: Status.ACTIVE,
        page: page,
        rowPerPage: rowsPerPage,
      });

      if (response) {
        // Restore selection state for current page
        const updatedStudents = response.data.map((student: Student) => {
          const shouldBeChecked = isSelectedAll
            ? !unselectedStudentIds.includes(student.id)
            : selectedStudentIds.includes(student.id);
          return {
            ...student,
            isAttend: shouldBeChecked,
          };
        });

        setStudentsData({
          ...response,
          data: updatedStudents,
        });

        // Initialize states for new page
        const newOriginalServerData: { [key: number]: { isAttend: boolean; noteAttendance: string } } = {};

        response.data.forEach((student: Student) => {
          newOriginalServerData[student.id] = {
            isAttend: false, // Default for new attendance
            noteAttendance: "",
          };
        });

        setOriginalServerData((prev) => ({ ...prev, ...newOriginalServerData }));
      }
    } catch (error) {
      dispatch(openAlert({ isOpen: true, title: "ERROR", subtitle: "Error fetching students data", type: "error" }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsData();
  }, [classId, date, page, rowsPerPage]);

  // Separate effect to update student data when selection state changes
  useEffect(() => {
    if (studentsData.data.length > 0) {
      const updatedStudents = studentsData.data.map((student: Student) => {
        const shouldBeChecked = isSelectedAll
          ? !unselectedStudentIds.includes(student.id)
          : selectedStudentIds.includes(student.id);
        return {
          ...student,
          isAttend: shouldBeChecked,
        };
      });

      setStudentsData({
        ...studentsData,
        data: updatedStudents,
      });
    }
  }, [isSelectedAll, selectedStudentIds, unselectedStudentIds]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select all visible students on current page
      setIsSelectedAll(true);
      setSelectedStudentIds([]);
      setUnselectedStudentIds([]);
    } else {
      // Deselect all students on current page
      setSelectedStudentIds([]);
      setUnselectedStudentIds([]);
      setIsSelectedAll(false);
    }

    // Update current page data for new attendance only
    const updatedStudents = studentsData.data.map((student) => ({
      ...student,
      isAttend: checked,
    }));
    setStudentsData({
      ...studentsData,
      data: updatedStudents,
    });
  };

  const handleSelectItem = (studentId: number, checked: boolean) => {
    if (isSelectedAll) {
      // When Select All is active, manage unselected items
      if (checked) {
        // Remove from unselected list (item is now selected)
        setUnselectedStudentIds((prev) => prev.filter((id) => id !== studentId));
      } else {
        // Add to unselected list (item is now unselected)
        setUnselectedStudentIds((prev) => [...prev, studentId]);
      }
    } else {
      // When not using Select All, manage selected items
      if (checked) {
        // Add to selected list
        setSelectedStudentIds((prev) => [...prev, studentId]);
      } else {
        // Remove from selected list
        setSelectedStudentIds((prev) => prev.filter((id) => id !== studentId));
      }
    }

    // Update current page data
    const updatedStudents = studentsData.data.map((student) => {
      if (student.id === studentId) {
        return { ...student, isAttend: checked };
      }
      return student;
    });
    setStudentsData({
      ...studentsData,
      data: updatedStudents,
    });
  };

  const handleNoteChange = (studentId: number, note: string) => {
    // Update the student data
    const updatedStudents = studentsData.data.map((student) => {
      if (student.id === studentId) {
        return { ...student, note: note };
      }
      return student;
    });
    setStudentsData({
      ...studentsData,
      data: updatedStudents,
    });
  };

  const handlePageChange = (newPage: number, newRowsPerPage: number) => {
    const shouldResetPage = newRowsPerPage !== rowsPerPage;
    if (shouldResetPage) {
      setRowsPerPage(newRowsPerPage);
      setPage(1);
    } else {
      setPage(newPage);
    }
  };

  const isItemSelected = (studentId: number) => {
    if (isSelectedAll) {
      // When Select All is used, show all items as selected unless they're in unselectedStudentIds
      return !unselectedStudentIds.includes(studentId);
    } else {
      // When manual selection, check if item is actually selected
      return selectedStudentIds.includes(studentId);
    }
  };

  const isSaveAllowed = () => {
    if (isSelectedAll) {
      return true; // Select All được sử dụng
    } else {
      return selectedStudentIds.length > 0; // Có ít nhất 1 student được chọn
    }
  };

  const handleSaveAttendance = async () => {
    if (!isSaveAllowed()) {
      dispatch(
        openAlert({ isOpen: true, title: "ERROR", subtitle: "Please select at least one student", type: "error" }),
      );
      return;
    }

    try {
      dispatch(openLoading());

      const createData: CreateBatchAttendanceDto = {
        classId: classId,
        sessionId: sessionId,
        learningDate: moment(date, "DD-MM-YYYY").toDate(),
        isSelectedAll: isSelectedAll,
        ...(isSelectedAll
          ? { unselectedStudentIds: unselectedStudentIds }
          : { selectedStudentIds: selectedStudentIds }),
      };

      await createBatchAttendance(createData);

      dispatch(
        openAlert({ isOpen: true, title: "SUCCESS", subtitle: "Attendance created successfully", type: "success" }),
      );

      // Calculate statistics for update
      const totalCount = studentsData.total;
      const attendedCount = isSelectedAll ? totalCount - unselectedStudentIds.length : selectedStudentIds.length;

      const statistics = {
        total: totalCount,
        attended: attendedCount,
        absent: totalCount - attendedCount,
      };

      onUpdateStatistics(statistics);

      onSaveSuccess();
    } catch (error: any) {
      dispatch(
        openAlert({
          isOpen: true,
          title: "ERROR",
          subtitle: error.message || "Failed to create attendance",
          type: "error",
        }),
      );
    } finally {
      dispatch(closeLoading());
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-4 w-full flex justify-center items-center">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary-c600"></div>
      </div>
    );
  }

  if (studentsData.data.length === 0) {
    return <div className="text-center py-4">No students found</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-row items-center justify-end">
        <div className="flex flex-row items-center gap-4">
          <div className="flex flex-row items-center gap-2">
            <Checkbox isChecked={isSelectedAll} onChange={handleSelectAll} />
            <div>All</div>
          </div>
        </div>
      </div>

      <div className="max-w-[100%] rounded-[10px] overflow-hidden">
        <div className="overflow-x-auto">
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
                  <th className="pl-3 py-4">{(page - 1) * rowsPerPage + index + 1}</th>
                  <th className="px-1 py-4">{student.name}</th>
                  <th className="px-1 py-4">
                    {moment(date || moment().format("DD-MM-YYYY"), "DD-MM-YYYY").format("D/M/YYYY")}
                  </th>
                  <th className="px-1 py-4">
                    <Checkbox
                      isChecked={isItemSelected(student.id)}
                      onChange={(checked) => handleSelectItem(student.id, checked)}
                    />
                  </th>
                  <th className="px-1 py-4">
                    <TextArea
                      rows={2}
                      label="Note of this student"
                      inputClassName="font-questrial"
                      value={student.note || ""}
                      onChange={(value: string) => handleNoteChange(student.id, value)}
                    />
                  </th>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <Button
          label="Save Attendance"
          className="!py-2.5 !px-8"
          status="success"
          disabled={!isSaveAllowed()}
          onClick={handleSaveAttendance}
        />
        <Pagination
          totalItems={studentsData.total}
          rowsEachPage={rowsPerPage}
          nowPage={page}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default NewAttendance;
