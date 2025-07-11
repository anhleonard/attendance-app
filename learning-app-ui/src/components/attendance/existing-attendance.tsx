"use client";
import Button from "@/lib/button";
import Checkbox from "@/lib/checkbox";
import Pagination from "@/lib/pagination";
import TextArea from "@/lib/textarea";
import moment from "moment";
import React, { useState, useEffect } from "react";
import { getAttendances, updateBatchAttendance } from "@/apis/services/attendances";
import { FilterAttendanceDto, UpdateBatchAttendanceDto } from "@/apis/dto";
import { useDispatch } from "react-redux";
import { openLoading, closeLoading } from "@/redux/slices/loading-slice";
import { openAlert } from "@/redux/slices/alert-slice";
import { AttendanceRecord, AttendanceStatistic, AttendanceResponse, ChangedItem } from "@/config/types";

interface ExistingAttendanceProps {
  classId: number;
  date: string;
  onSaveSuccess: () => void;
  onUpdateStatistics: (statistics: AttendanceStatistic) => void;
  initialAttendanceData: AttendanceResponse; // Optional initial data to avoid API call
}

const ExistingAttendance: React.FC<ExistingAttendanceProps> = ({
  classId,
  date,
  onSaveSuccess,
  onUpdateStatistics,
  initialAttendanceData,
}) => {
  const dispatch = useDispatch();
  const [attendanceData, setAttendanceData] = useState<AttendanceResponse>(
    initialAttendanceData || {
      statistic: { total: 0, attended: 0, absent: 0 },
      total: 0,
      page: 1,
      rowPerPage: 10,
      data: [],
    },
  );
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(!initialAttendanceData); // Don't show loading if we have initial data
  const [changedItems, setChangedItems] = useState<ChangedItem[]>([]);
  const [originalServerData, setOriginalServerData] = useState<{
    [key: number]: { isAttend: boolean; noteAttendance: string };
  }>({});

  // Helper functions for change tracking
  const hasRecordChanged = (
    original: { isAttend: boolean; noteAttendance: string },
    current: { isAttend: boolean; noteAttendance: string },
  ): boolean => {
    return original.isAttend !== current.isAttend || original.noteAttendance !== current.noteAttendance;
  };

  const updateChangedItems = (
    id: number,
    studentId: number,
    currentData: { isAttend: boolean; noteAttendance: string },
  ) => {
    const originalData = originalServerData[id];
    if (!originalData) return;

    const hasChanged = hasRecordChanged(originalData, currentData);

    setChangedItems((prev) => {
      if (hasChanged) {
        const existingIndex = prev.findIndex((item) => item.id === id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            currentData,
          };
          return updated;
        } else {
          return [
            ...prev,
            {
              id,
              studentId,
              originalData,
              currentData,
            },
          ];
        }
      } else {
        return prev.filter((item) => item.id !== id);
      }
    });
  };

  const isRecordChanged = (id: number) => {
    return changedItems.some((item) => item.id === id);
  };

  const getCurrentNoteValue = (id: number) => {
    const changedItem = changedItems.find((item) => item.id === id);
    if (changedItem) {
      return changedItem.currentData.noteAttendance;
    }
    return "";
  };

  const clearChangedItems = () => {
    setChangedItems([]);
  };

  const fetchAttendanceData = async () => {
    if (!date) return;

    // Skip fetching if we have initial data and we're on page 1 with default rowsPerPage
    if (initialAttendanceData && page === 1 && rowsPerPage === 10) {
      return;
    }

    try {
      setIsLoading(true);
      const filterData: FilterAttendanceDto = {
        classId: classId,
        learningDate: moment(date, "DD-MM-YYYY").toDate(),
        page: page,
        rowPerPage: rowsPerPage,
      };
      const response = await getAttendances(filterData);

      if (response && response.data.length > 0) {
        // Restore changed items state
        const updatedData = response.data.map((record: AttendanceRecord) => {
          const changedItem = changedItems.find((item) => item.id === record.id);
          if (changedItem) {
            return {
              ...record,
              isAttend: changedItem.currentData.isAttend,
              noteAttendance: changedItem.currentData.noteAttendance,
            };
          }
          return record;
        });

        setAttendanceData({
          ...response,
          data: updatedData,
        });

        // Store original server data
        const newOriginalServerData: { [key: number]: { isAttend: boolean; noteAttendance: string } } = {};
        response.data.forEach((record: AttendanceRecord) => {
          newOriginalServerData[record.id] = {
            isAttend: record.isAttend,
            noteAttendance: record.noteAttendance,
          };
        });
        setOriginalServerData((prev) => ({ ...prev, ...newOriginalServerData }));

        // Update statistics
        const attendedCount = updatedData.filter((record: AttendanceRecord) => record.isAttend).length;
        const totalCount = response.statistic.total;

        setAttendanceData((prevData) => ({
          ...prevData,
          statistic: {
            ...response.statistic,
            attended:
              attendedCount +
              (response.statistic.attended - response.data.filter((r: AttendanceRecord) => r.isAttend).length),
            absent:
              totalCount -
              (attendedCount +
                (response.statistic.attended - response.data.filter((r: AttendanceRecord) => r.isAttend).length)),
          },
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Always fetch data when classId, date, page, or rowsPerPage changes
    fetchAttendanceData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, date, page, rowsPerPage]);

  // Handle initial data separately
  useEffect(() => {
    if (initialAttendanceData && page === 1 && rowsPerPage === 10) {
      // Use initial data without fetching
      setAttendanceData(initialAttendanceData);
      setIsLoading(false);
    }
  }, [initialAttendanceData, page, rowsPerPage]);

  // Initialize original server data if we have initial data
  useEffect(() => {
    if (initialAttendanceData && initialAttendanceData.data.length > 0) {
      const newOriginalServerData: { [key: number]: { isAttend: boolean; noteAttendance: string } } = {};
      initialAttendanceData.data.forEach((record: AttendanceRecord) => {
        newOriginalServerData[record.id] = {
          isAttend: record.isAttend,
          noteAttendance: record.noteAttendance,
        };
      });
      setOriginalServerData(newOriginalServerData);
    }
  }, [initialAttendanceData]);

  const handleChangeAttendanceChecked = (id: number, value: boolean, studentId: number) => {
    const currentRecord = attendanceData.data.find((record) => record.id === id);
    if (!currentRecord) return;

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

    // Track changes for existing attendance
    const currentData = {
      isAttend: value,
      noteAttendance: currentRecord.noteAttendance,
    };
    updateChangedItems(id, studentId, currentData);
  };

  const handleNoteChange = (recordId: number, note: string) => {
    const currentRecord = attendanceData.data.find((record) => record.id === recordId);
    if (!currentRecord) return;

    const updatedRecords = attendanceData.data.map((record) =>
      record.id === recordId ? { ...record, noteAttendance: note } : record,
    );
    setAttendanceData({
      ...attendanceData,
      data: updatedRecords,
    });

    const currentData = {
      isAttend: currentRecord.isAttend,
      noteAttendance: note,
    };
    updateChangedItems(recordId, currentRecord.studentId, currentData);
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

  const handleSaveAttendance = async () => {
    if (changedItems.length === 0) {
      dispatch(openAlert({ isOpen: true, title: "INFO", subtitle: "No changes to save", type: "info" }));
      return;
    }

    try {
      dispatch(openLoading());

      const updateData: UpdateBatchAttendanceDto = {
        attendances: changedItems.map((item) => ({
          attendanceId: item.id,
          isAttend: item.currentData.isAttend,
          noteAttendance: item.currentData.noteAttendance,
        })),
      };

      await updateBatchAttendance(updateData);

      dispatch(
        openAlert({ isOpen: true, title: "SUCCESS", subtitle: "Attendance updated successfully", type: "success" }),
      );

      // Update statistics
      onUpdateStatistics(attendanceData.statistic);

      // Clear changed items after successful save
      clearChangedItems();

      // Refresh data
      fetchAttendanceData();

      onSaveSuccess();
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

  if (attendanceData.data.length === 0) {
    return <div className="text-center py-4">No attendance records found</div>;
  }

  return (
    <div className="flex flex-col gap-3">
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
              {[...attendanceData.data].map((record, index) => (
                <tr
                  key={record.id}
                  className={` ${
                    isRecordChanged(record.id) ? "border-l-[3px] border-yellow-400" : "hover:bg-primary-c10"
                  }`}
                >
                  <th className="pl-3 py-4">{(page - 1) * rowsPerPage + index + 1}</th>
                  <th className="px-1 py-4">{record.student.name}</th>
                  <th className="px-1 py-4">{moment(record.learningDate).format("D/M/YYYY")}</th>
                  <th className="px-1 py-4">
                    <Checkbox
                      isChecked={record.isAttend}
                      onChange={(checked) => handleChangeAttendanceChecked(record.id, checked, record.studentId)}
                    />
                  </th>
                  <th className="px-1 py-4">
                    <TextArea
                      rows={2}
                      defaultValue={getCurrentNoteValue(record.id) || record.noteAttendance}
                      onChange={(value) => handleNoteChange(record.id, value)}
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
          label={changedItems.length > 0 ? `Save Changes (${changedItems.length} modified)` : "No changes to save"}
          className="!py-2.5 !px-8"
          status="success"
          disabled={changedItems.length === 0}
          onClick={handleSaveAttendance}
        />
        <Pagination
          totalItems={attendanceData.total}
          rowsEachPage={rowsPerPage}
          nowPage={page}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default ExistingAttendance;
