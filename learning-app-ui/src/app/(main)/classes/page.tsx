"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Tooltip } from "react-tooltip";
import Image from "next/image";
import AddClass from "@/components/class/add-class";
import DetailClassModal from "@/components/class/detail-class-modal";
import EditClass from "@/components/class/edit-class";
import { Class, ConfirmState, ModalState } from "@/config/types";
import Button from "@/lib/button";
import Label from "@/lib/label";
import Pagination from "@/lib/pagination";
import Select from "@/lib/select";
import { closeConfirm, openConfirm } from "@/redux/slices/confirm-slice";
import { openDrawer } from "@/redux/slices/drawer-slice";
import { openModal } from "@/redux/slices/modal-slice";
import { getClasses, updateClass } from "@/apis/services/classes";
import { Status } from "@/config/enums";
import { closeLoading, openLoading } from "@/redux/slices/loading-slice";
import { openAlert } from "@/redux/slices/alert-slice";
import moment from "moment";
import { UpdateClassDto } from "@/apis/dto";
import { RootState } from "@/redux/store";
import { refetch } from "@/redux/slices/refetch-slice";
import { updateSystemInfo } from "@/redux/slices/system-slice";
import TextField from "@/lib/textfield";
import { EmptyRow } from "@/lib/empty-row";

interface ClassesResponse {
  total: number;
  data: Class[];
}

const Classes = () => {
  const dispatch = useDispatch();
  const [classesData, setClassesData] = useState<ClassesResponse>({ total: 0, data: [] });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterName, setFilterName] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | undefined>(undefined);
  const refetchCount = useSelector((state: RootState) => state.refetch.count);
  const activeClasses = useSelector((state: RootState) => state.system.activeClasses);

  const fetchClasses = async (currentPage: number, currentRowsPerPage: number) => {
    try {
      dispatch(openLoading());
      const response = await getClasses({
        page: currentPage,
        rowPerPage: currentRowsPerPage,
        name: filterName,
        status: filterStatus,
      });
      setClassesData(response);
    } finally {
      dispatch(closeLoading());
    }
  };

  useEffect(() => {
    fetchClasses(page, rowsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, refetchCount]);

  const handleFilter = () => {
    setPage(1); // Reset to first page when filtering
    fetchClasses(1, rowsPerPage);
  };

  const handleResetFilter = async () => {
    // Reset states first
    setFilterName("");
    setFilterStatus(undefined);
    setPage(1);

    // Call API with empty filters
    try {
      dispatch(openLoading());
      const response = await getClasses({
        page: 1,
        rowPerPage: rowsPerPage,
        name: "",
        status: undefined,
      });
      
      if (response) {
        setClassesData(response);
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

  const handlePageChange = (newPage: number, newRowsPerPage: number) => {
    if (newRowsPerPage !== rowsPerPage) {
      setRowsPerPage(newRowsPerPage);
      setPage(1); // Reset to first page when changing rows per page
    } else {
      setPage(newPage);
    }
  };

  const handleOpenViewModal = (classItem: Class) => {
    const modal: ModalState = {
      isOpen: true,
      title: "Detail class",
      content: <DetailClassModal classItem={classItem} />,
      className: "max-w-lg",
    };

    dispatch(openModal(modal));
  };

  const handleOpenDrawer = () => {
    const drawer: ModalState = {
      isOpen: true,
      title: "Add class",
      content: <AddClass />,
    };

    dispatch(openDrawer(drawer));
  };

  const handleOpenEditDrawer = (classItem: Class) => {
    const drawer: ModalState = {
      isOpen: true,
      title: "Edit class",
      content: <EditClass classItem={classItem} />,
    };

    dispatch(openDrawer(drawer));
  };

  const handleOpenConfirmChangeStatus = (classItem: Class) => {
    const confirm: ConfirmState = {
      isOpen: true,
      title: "Are you sure?",
      subtitle: `Are you sure you want to ${classItem?.status === Status.ACTIVE ? "disable" : "enable"} this class?`,
      titleAction: classItem?.status === Status.ACTIVE ? "Disable" : "Enable",
      handleAction: async () => {
        try {
          dispatch(openLoading());
          const classData: UpdateClassDto = {
            id: classItem?.id,
            status: classItem?.status === Status.ACTIVE ? Status.INACTIVE : Status.ACTIVE,
          };

          await updateClass(classData);
          
          // Remove disabled class from Redux state
          if (classItem?.status === Status.ACTIVE) {
            const updatedActiveClasses = activeClasses?.filter(
              (cls) => cls.value !== classItem.id.toString()
            ) || [];
            
            dispatch(
              updateSystemInfo({
                activeClasses: updatedActiveClasses,
              })
            );
          }
          
          dispatch(
            openAlert({
              isOpen: true,
              title: "SUCCESS",
              subtitle: `Class ${classItem?.status === Status.ACTIVE ? "disabled" : "enabled"} successfully!`,
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

  return (
    <div className="p-5">
      <div className="flex flex-row items-center gap-2 mb-8">
        <Image src="/icons/vertical-divide.svg" alt="vertical-divide" width={2} height={20} />
        <div className="text-xl font-bold">Classes</div>
      </div>
      <div className="flex flex-col">
        <div className="font-bold text-base">1. Class list</div>

        {/* filter class */}
        <div className="grid grid-cols-4 gap-3 mb-5 mt-4">
          <TextField label="Search class" value={filterName} onChange={handleNameChange} />
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

        <div className="inline-grid justify-end items-center mb-2">
          <Button
            label="Add class"
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
                  <th className="px-1 py-4">Created at</th>
                  <th className="px-1 py-4">Sessions</th>
                  <th className="px-1 py-4">Amount</th>
                  <th className="px-1 py-4">Status</th>
                  <th className="px-1 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {classesData?.data.length === 0 ? (
                  <EmptyRow colSpan={7} />
                ) : (
                  classesData?.data.map((classItem, index) => {
                    // Calculate average amount from sessions
                    const totalAmount = classItem.sessions.reduce((sum, session) => sum + session.amount, 0);
                    const averageAmount = classItem.sessions.length > 0 ? totalAmount / classItem.sessions.length : 0;

                    return (
                      <tr key={classItem.id} className="hover:bg-primary-c10 hover:text-grey-c700">
                        <th className="pl-3 py-4">{(page - 1) * rowsPerPage + index + 1}</th>
                        <th className="px-1 py-4">{classItem.name}</th>
                        <th className="px-1 py-4">{moment(classItem.createdAt).format("DD/MM/YYYY")}</th>
                        <th className="px-1 py-4">{classItem.sessions.length}</th>
                        <th className="px-1 py-4">{averageAmount.toLocaleString()} VND</th>
                        <th className="px-1 py-4">
                          <Label
                            status={classItem.status === Status.ACTIVE ? "success" : "error"}
                            label={classItem.status}
                          />
                        </th>
                        <th className="px-1 py-4 text-center">
                          <div className="flex justify-center items-center gap-3">
                            <button
                              data-tooltip-id={`view-icon-${classItem.id}`}
                              data-tooltip-content="View"
                              onClick={() => handleOpenViewModal(classItem)}
                            >
                              <Image src="/icons/detail-icon.svg" alt="detail-icon" width={24} height={24} />
                            </button>
                            <Tooltip id={`view-icon-${classItem.id}`} />

                            <button
                              data-tooltip-id={`edit-icon-${classItem.id}`}
                              data-tooltip-content="Edit"
                              onClick={() => handleOpenEditDrawer(classItem)}
                            >
                              <Image src="/icons/edit-icon.svg" alt="edit-icon" width={24} height={24} />
                            </button>
                            <Tooltip id={`edit-icon-${classItem.id}`} />

                            <button
                              data-tooltip-id={`confirm-icon-${classItem.id}`}
                              data-tooltip-content={classItem?.status === Status.ACTIVE ? "Disable" : "Enable"}
                              onClick={() => handleOpenConfirmChangeStatus(classItem)}
                            >
                              {classItem?.status === Status.ACTIVE ? (
                                <Image src="/icons/disabled-icon.svg" alt="disabled-icon" width={22} height={22} />
                              ) : (
                                <Image src={"/icons/enabled-icon.svg"} alt="enabled-icon" width={23} height={23} />
                              )}
                            </button>
                            <Tooltip id={`confirm-icon-${classItem.id}`} />
                          </div>
                        </th>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-5">
          <Pagination
            totalItems={classesData.total}
            rowsEachPage={rowsPerPage}
            nowPage={page}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
};

export default Classes;
