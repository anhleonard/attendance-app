"use client";
import { getStudents } from "@/apis/services/students";
import AddStudent from "@/components/student/add-student";
import EditStudent from "@/components/student/edit-student";
import { ConfirmState, ModalState, Student, StudentClass } from "@/config/types";
import Button from "@/lib/button";
import Pagination from "@/lib/pagination";
import Select from "@/lib/select";
import TextField from "@/lib/textfield";
import { openConfirm } from "@/redux/slices/confirm-slice";
import { openDrawer } from "@/redux/slices/drawer-slice";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Tooltip } from "react-tooltip";
import { RootState } from "@/redux/store";
import { refetch } from "@/redux/slices/refetch-slice";
import moment from "moment";
import { Status } from "@/config/enums";
import { closeLoading } from "@/redux/slices/loading-slice";
import { openLoading } from "@/redux/slices/loading-slice";
import { openAlert } from "@/redux/slices/alert-slice";

interface StudentsResponse {
  total: number;
  data: Student[];
}

const Students = () => {
  const dispatch = useDispatch();
  const [studentsData, setStudentsData] = useState<StudentsResponse>({ total: 0, data: [] });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const refetchCount = useSelector((state: RootState) => state.refetch.count);

  const fetchStudents = async (currentPage: number, currentRowsPerPage: number) => {
    try {
      dispatch(openLoading());
      const response = await getStudents({
        page: currentPage,
        rowPerPage: currentRowsPerPage,
      });
      if (response) {
        setStudentsData(response);
      }
    } catch (err: any) {
      dispatch(
        openAlert({
          isOpen: true,
          title: "ERROR",
          subtitle: err?.message || "Failed to fetch students",
          type: "error",
        }),
      );
    } finally {
      dispatch(closeLoading());
    }
  };

  useEffect(() => {
    fetchStudents(page, rowsPerPage);
  }, [page, rowsPerPage, refetchCount]);

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

  const handleOpenEditDrawer = (student: Student) => {
    const drawer: ModalState = {
      isOpen: true,
      title: "Edit student",
      content: <EditStudent student={student} />,
    };

    dispatch(openDrawer(drawer));
  };

  const handleOpenConfirmDelete = () => {
    const confirm: ConfirmState = {
      isOpen: true,
      title: "Are you sure?",
      subtitle: "This action cannot be undone. All values associated in this student will be lost.",
      titleAction: "Delete",
      handleAction: () => {},
    };

    dispatch(openConfirm(confirm));
  };

  const getActiveClassName = (classes: StudentClass[] | undefined) => {
    if (!classes?.length) return "-";
    const activeClass = classes.find((classItem) => classItem.status === Status.ACTIVE);
    return activeClass?.class?.name || "-";
  };

  return (
    <div className="p-5">
      <div className="flex flex-row items-center gap-2 mb-8">
        <Image src="/icons/vertical-divide.svg" alt="vertical-divide" width={2} height={20} />
        <div className="text-xl font-bold">Students</div>
      </div>
      <div className="flex flex-col">
        <div className="font-bold text-base">1. Student list</div>

        {/* filter class */}
        <div className="grid grid-cols-6 gap-3 mb-5 mt-4">
          <div className="col-span-4 grid sm:grid-cols-4 sm:gap-3">
            <div className="sm:col-span-2">
              <TextField label="Search name" />
            </div>
            <Select
              label="Status"
              options={[
                { label: "Active", value: "ACTIVE" },
                { label: "Inactive", value: "INACTIVE" },
              ]}
            />
          </div>
          <div className="col-span-2 text-end">
            {/* put item center when use grid */}
            <div className="inline-grid justify-center items-center">
              <Button
                label="Add student"
                status="success"
                className="py-3 px-4"
                startIcon={<Image src={"/icons/add-icon.svg"} alt="add-icon" width={20} height={20} />}
                onClick={handleOpenDrawer}
              />
            </div>
          </div>
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
                  <th className="px-1 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {studentsData?.data?.map((student, index) => (
                  <tr key={student.id} className="hover:bg-primary-c10 hover:text-grey-c700">
                    <th className="pl-3 py-4">{(page - 1) * rowsPerPage + index + 1}</th>
                    <th className="px-1 py-4 font-questrial text-grey-c900 text-[15px]">{student.name}</th>
                    <th className="px-1 py-4">{moment(student.dob).format("DD/MM/YYYY")}</th>
                    <th className="px-1 py-4">{getActiveClassName(student.classes)}</th>
                    <th className="px-1 py-4 font-questrial text-grey-c900 text-[15px]">{student.parent}</th>
                    <th className="px-1 py-4">{student.phoneNumber}</th>
                    <th className="px-1 py-4">{student.secondPhoneNumber || "-"}</th>
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

                        <button
                          data-tooltip-id={`delete-icon-${student?.id}`}
                          data-tooltip-content="Delete"
                          onClick={handleOpenConfirmDelete}
                        >
                          <Image src="/icons/delete-icon.svg" alt="delete-icon" width={24} height={24} />
                        </button>
                        <Tooltip id={`delete-icon-${student?.id}`} />
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
