"use client";
import DetailHistoryModal from "@/components/history/detail-history";
import { ModalState } from "@/config/types";
import Label from "@/lib/label";
import Pagination from "@/lib/pagination";
import Select from "@/lib/select";
import Button from "@/lib/button";
import TextField from "@/lib/textfield";
import { openModal } from "@/redux/slices/modal-slice";
import { openLoading, closeLoading } from "@/redux/slices/loading-slice";
import { getHistories } from "@/apis/services/histories";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Tooltip } from "react-tooltip";
import { RootState } from "@/redux/store";
import { OptionState } from "@/config/types";

interface HistoryResponse {
  total: number;
  data: Array<{
    id: number;
    name: string;
    currentClass: {
      id: number;
      name: string;
      description: string;
      status: string;
      totalAttendances: number;
      startDate: string;
      endDate: string;
    } | null;
    pastClasses: Array<{
      id: number;
      name: string;
      description: string;
      status: string;
      totalAttendances: number;
      startDate: string;
      endDate: string;
    }>;
  }>;
}

const Histories = () => {
  const dispatch = useDispatch();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [historiesData, setHistoriesData] = useState<HistoryResponse>({ total: 0, data: [] });
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const activeClasses: OptionState[] = useSelector((state: RootState) => state.system.activeClasses) || [];

  const fetchHistories = async (currentPage: number, currentRowsPerPage: number) => {
    try {
      dispatch(openLoading());
      const filterData = {
        page: currentPage,
        rowPerPage: currentRowsPerPage,
        ...(selectedStudent && { studentName: selectedStudent }),
        ...(selectedClass && { classId: selectedClass }),
      };
      const response = await getHistories(filterData);
      setHistoriesData(response);
    } finally {
      dispatch(closeLoading());
    }
  };

  useEffect(() => {
    fetchHistories(page, rowsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

  const handlePageChange = (newPage: number, newRowsPerPage: number) => {
    if (newRowsPerPage !== rowsPerPage) {
      setRowsPerPage(newRowsPerPage);
      setPage(1); // Reset to first page when changing rows per page
    } else {
      setPage(newPage);
    }
  };

  const handleCancel = () => {
    // Reset states first
    setSelectedStudent("");
    setSelectedClass(null);
    setPage(1);

    // Call API with empty filters
    fetchHistories(1, rowsPerPage);
  };

  const handleFilter = () => {
    setPage(1); // Reset to first page when filtering
    fetchHistories(1, rowsPerPage);
  };

  const handleStudentChange = (value: string | React.ChangeEvent<HTMLInputElement>) => {
    if (typeof value === 'string') {
      setSelectedStudent(value);
    } else {
      setSelectedStudent(value.target.value);
    }
  };

  const handleOpenViewModal = (history: HistoryResponse["data"][0]) => {
    const modal: ModalState = {
      isOpen: true,
      title: "History detail",
      content: <DetailHistoryModal history={history} />,
      className: "max-w-lg",
    };

    dispatch(openModal(modal));
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
          <TextField
            label="Student name"
            value={selectedStudent}
            onChange={handleStudentChange}
          />
          <Select
            label="Select current class"
            options={activeClasses}
            defaultValue={selectedClass?.toString() || ""}
            onChange={(value) => setSelectedClass(value ? parseInt(value) : null)}
          />
          <div className="flex flex-row gap-3">
            <Button label="Filter" className="py-[13px] px-8" status="success" onClick={handleFilter} />
            <Button label="Cancel" className="py-[13px] px-8" status="cancel" onClick={handleCancel} />
          </div>
        </div>

        {/* table */}
        <div className="max-w-[100%] rounded-[10px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-auto w-full text-left">
              <thead className={`text-grey-c700 uppercase bg-primary-c50`}>
                <tr className="hover:bg-success-c50 hover:text-grey-c700 font-bold">
                  <th className="pl-3 py-4">STT</th>
                  <th className="px-1 py-4">Name</th>
                  <th className="px-1 py-4">Current class</th>
                  <th className="px-1 py-4">Past classes</th>
                  <th className="px-1 py-4">Total joined</th>
                  <th className="px-1 py-4">Status</th>
                  <th className="px-1 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {historiesData.data.map((history, index) => (
                  <tr key={history.id} className="hover:bg-primary-c10">
                    <th className="pl-3 py-4">{(page - 1) * rowsPerPage + index + 1}</th>
                    <th className="px-1 py-4">{history.name}</th>
                    <th className="px-1 py-4">{history.currentClass?.name || "--"}</th>
                    <th className="px-1 py-4">
                      {history.pastClasses.length > 0
                        ? [...history.pastClasses].sort(
                            (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
                          )[0].name
                        : "--"}
                    </th>
                    <th className="px-1 py-4">
                      {(history.currentClass?.totalAttendances || 0) +
                        history.pastClasses.reduce((sum, pastClass) => sum + pastClass.totalAttendances, 0)}
                    </th>
                    <th className="px-1 py-4">
                      <Label status={history.currentClass ? "success" : "error"} label={history.currentClass?.status || "INACTIVE"} />
                    </th>
                    <th className="px-1 py-4 text-center">
                      <div className="flex justify-center items-center gap-3">
                        <button
                          onClick={() => handleOpenViewModal(history)}
                          title="View"
                          data-tooltip-id="view-icon"
                          data-tooltip-content="View"
                        >
                          <Image src="/icons/detail-icon.svg" alt="view-icon" width={24} height={24} />
                        </button>
                        <Tooltip id="view-icon" />
                      </div>
                    </th>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-5">
          <Pagination
            totalItems={historiesData.total}
            rowsEachPage={rowsPerPage}
            nowPage={page}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
};

export default Histories;
