"use client";
import { getStudents, updateStudent } from "@/apis/services/students";
import { UpdateStudentDto } from "@/apis/dto";
import AddStudent from "@/components/student/add-student";
import EditStudent from "@/components/student/edit-student";
import { ConfirmState, ModalState, Student, StudentClass, OptionState } from "@/config/types";
import Button from "@/lib/button";
import Pagination from "@/lib/pagination";
import Select from "@/lib/select";
import TextField from "@/lib/textfield";
import { openConfirm, closeConfirm } from "@/redux/slices/confirm-slice";
import { openDrawer } from "@/redux/slices/drawer-slice";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Tooltip } from "react-tooltip";
import { RootState } from "@/redux/store";
import { refetch } from "@/redux/slices/refetch-slice";
import moment from "moment";
import { SortType, Status, Role } from "@/config/enums";
import { closeLoading } from "@/redux/slices/loading-slice";
import { openLoading } from "@/redux/slices/loading-slice";
import { openAlert } from "@/redux/slices/alert-slice";
import Label from "@/lib/label";
import { openModal } from "@/redux/slices/modal-slice";
import ImportFileModal from "@/components/student/import-file-modal";
import { EmptyRow } from "@/lib/empty-row";
import { maskPhoneNumber } from "@/config/functions";

interface StudentsResponse {
  total: number;
  data: Student[];
}

const Students = () => {
  const dispatch = useDispatch();
  const [studentsData, setStudentsData] = useState<StudentsResponse>({ total: 0, data: [] });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterName, setFilterName] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | undefined>(undefined);
  const [filterClassId, setFilterClassId] = useState<number | undefined>(undefined);
  const refetchCount = useSelector((state: RootState) => state.refetch.count);
  const activeClasses: OptionState[] = useSelector((state: RootState) => state.system.activeClasses) || [];
  const { profile } = useSelector((state: RootState) => state.system);

  const fetchStudents = async (currentPage: number, currentRowsPerPage: number) => {
    try {
      dispatch(openLoading());
      const response = await getStudents({
        page: currentPage,
        rowPerPage: currentRowsPerPage,
        name: filterName,
        ...(filterStatus && { status: filterStatus }),
        ...(filterClassId && {
          classId: filterClassId,
          studentClassStatus: Status.ACTIVE,
        }),
        sort: {
          title: "updatedAt",
          type: SortType.DESC,
        },
      });
      if (response) {
        setStudentsData(response);
      }
    } finally {
      dispatch(closeLoading());
    }
  };

  useEffect(() => {
    fetchStudents(page, rowsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, refetchCount]);

  const handleFilter = () => {
    setPage(1); // Reset to first page when filtering
    fetchStudents(1, rowsPerPage);
  };

  const handleResetFilter = async () => {
    // Reset states first
    setFilterName("");
    setFilterStatus(undefined);
    setFilterClassId(undefined);
    setPage(1);

    // Call API with empty filters
    dispatch(openLoading());
    try {
      const response = await getStudents({
        page: 1,
        rowPerPage: rowsPerPage,
        name: "",
        status: undefined,
        classId: undefined,
      });
      if (response) {
        setStudentsData(response);
      }
    } finally {
      dispatch(closeLoading());
    }
  };

  const handleNameChange = (value: string | React.ChangeEvent<HTMLInputElement>) => {
    if (typeof value === "string") {
      setFilterName(value);
    } else {
      setFilterName(value.target.value);
    }
  };

  const handleStatusChange = (value: string) => {
    setFilterStatus(value as Status);
  };

  const handleClassChange = (value: string) => {
    setFilterClassId(value ? parseInt(value) : undefined);
  };

  const handlePageChange = (newPage: number, newRowsPerPage: number) => {
    if (newRowsPerPage !== rowsPerPage) {
      setRowsPerPage(newRowsPerPage);
      setPage(1); // Reset to first page when changing rows per page
    } else {
      setPage(newPage);
    }
  };

  const handleOpenDrawer = () => {
    const drawer: ModalState = {
      isOpen: true,
      title: "Add student",
      content: <AddStudent />,
    };

    dispatch(openDrawer(drawer));
  };

  const handleOpenModalImportFile = () => {
    const modal: ModalState = {
      isOpen: true,
      title: "Import file",
      content: <ImportFileModal />,
      className: "max-w-2xl",
    };

    dispatch(openModal(modal));
  };

  const handleOpenEditDrawer = (student: Student) => {
    const drawer: ModalState = {
      isOpen: true,
      title: "Edit student",
      content: <EditStudent student={student} />,
    };

    dispatch(openDrawer(drawer));
  };

  const handleOpenConfirmChangeStatus = (student: Student) => {
    const confirm: ConfirmState = {
      isOpen: true,
      title: "Are you sure?",
      subtitle: `Are you sure you want to ${student?.status === Status.ACTIVE ? "disable" : "enable"} this student?`,
      titleAction: student?.status === Status.ACTIVE ? "Disable" : "Enable",
      handleAction: async () => {
        try {
          dispatch(openLoading());
          const studentData = {
            id: student?.id,
            status: student?.status === Status.ACTIVE ? Status.INACTIVE : Status.ACTIVE,
          } as UpdateStudentDto;

          await updateStudent(studentData);
          dispatch(
            openAlert({
              isOpen: true,
              title: "SUCCESS",
              subtitle: `Student ${student?.status === Status.ACTIVE ? "disabled" : "enabled"} successfully!`,
              type: "success",
            }),
          );
        } finally {
          dispatch(closeLoading());
          dispatch(closeConfirm());
          dispatch(refetch());
        }
      },
    };

    dispatch(openConfirm(confirm));
  };

  const getActiveClassName = (classes: StudentClass[] | undefined) => {
    if (!classes?.length) return "-";
    const activeClass = classes.find((classItem) => classItem.status === Status.ACTIVE);
    return activeClass?.class?.name || "-";
  };

  // Function to mask phone numbers if user is TA
  const getDisplayPhoneNumber = (phoneNumber: string) => {
    if (profile?.role === Role.TA) {
      return maskPhoneNumber(phoneNumber);
    }
    return phoneNumber;
  };

  return (
    <div className="p-5">
      <div className="flex flex-row items-center gap-2 mb-8">
        <Image src="/icons/vertical-divide.svg" alt="vertical-divide" width={2} height={20} />
        <div className="text-xl font-bold">Students</div>
      </div>
      <div className="flex flex-col">
        <div className="font-bold text-base">1. Student list</div>

        {/* filter students */}
        <div className="grid grid-cols-4 gap-3 mb-5 mt-4">
          <TextField label="Search name" value={filterName} onChange={handleNameChange} />
          <Select
            label="Select class"
            defaultValue={filterClassId?.toString()}
            onChange={handleClassChange}
            options={activeClasses}
          />
          <Select
            label="Status"
            defaultValue={filterStatus}
            onChange={handleStatusChange}
            options={[
              { label: "Active", value: Status.ACTIVE },
              { label: "Inactive", value: Status.INACTIVE },
            ]}
          />
          <div className="flex flex-row gap-3">
            <Button label="Filter" className="py-[13px] px-8" status="success" onClick={handleFilter} />
            <Button label="Cancel" className="py-[13px] px-8" status="cancel" onClick={handleResetFilter} />
          </div>
        </div>

        <div className="flex flex-row gap-3 justify-end items-center mb-2">
          <Button
            label="Import file"
            status="primary"
            className="py-2.5 px-4"
            startIcon={<Image src={"/icons/add-icon.svg"} alt="add-icon" width={20} height={20} />}
            onClick={handleOpenModalImportFile}
          />
          <Button
            label="Add student"
            status="success"
            className="py-2.5 px-4"
            startIcon={<Image src={"/icons/add-icon.svg"} alt="add-icon" width={20} height={20} />}
            onClick={handleOpenDrawer}
          />
        </div>

        {/* table 1 */}
        <div className="max-w-[100%] rounded-[10px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-auto w-full text-left">
              <thead className={`text-grey-c700 uppercase bg-primary-c50`}>
                <tr className="hover:bg-success-c50 hover:text-grey-c700 font-bold">
                  <th className="pl-3 py-4">STT</th>
                  <th className="px-1 py-4">Name</th>
                  <th className="px-1 py-4">Date of birth</th>
                  <th className="px-1 py-4">Class</th>
                  <th className="px-1 py-4">Parent</th>
                  <th className="px-1 py-4">Phone number</th>
                  <th className="px-1 py-4">Secondary</th>
                  <th className="px-1 py-4">Status</th>
                  <th className="px-1 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {studentsData?.data?.length > 0 ? (
                  studentsData?.data?.map((student, index) => (
                    <tr key={student.id} className="hover:bg-primary-c10 hover:text-grey-c700">
                      <th className="pl-3 py-4">{(page - 1) * rowsPerPage + index + 1}</th>
                      <th className="px-1 py-4">{student.name}</th>
                      <th className="px-1 py-4">{moment(student.dob).format("DD/MM/YYYY")}</th>
                      <th className="px-1 py-4">{getActiveClassName(student.classes)}</th>
                      <th className="px-1 py-4">{student.parent}</th>
                      <th className="px-1 py-4">{getDisplayPhoneNumber(student.phoneNumber)}</th>
                      <th className="px-1 py-4">{student.secondPhoneNumber ? getDisplayPhoneNumber(student.secondPhoneNumber) : "--"}</th>
                      <th className="px-1 py-4">
                        <Label status={student.status === Status.ACTIVE ? "success" : "error"} label={student.status} />
                      </th>
                      <th className="px-1 py-4 text-center">
                        <div className="flex justify-center items-center gap-3">
                          <button
                            data-tooltip-id={`edit-icon-${student?.id}`}
                            data-tooltip-content="Edit"
                            onClick={() => handleOpenEditDrawer(student)}
                          >
                            <Image src="/icons/edit-icon.svg" alt="edit-icon" width={24} height={24} />
                          </button>
                          <Tooltip id={`edit-icon-${student?.id}`} />

                          {student?.status === Status.ACTIVE && (
                            <>
                              <button
                                data-tooltip-id={`confirm-icon-${student?.id}`}
                                data-tooltip-content="Disable"
                                onClick={() => handleOpenConfirmChangeStatus(student)}
                              >
                                <Image src="/icons/disabled-icon.svg" alt="disabled-icon" width={22} height={22} />
                              </button>
                              <Tooltip id={`confirm-icon-${student?.id}`} />
                            </>
                          )}
                        </div>
                      </th>
                    </tr>
                  ))
                ) : (
                  <EmptyRow colSpan={9} />
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-5">
          <Pagination
            totalItems={studentsData.total}
            rowsEachPage={rowsPerPage}
            nowPage={page}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
};

export default Students;
