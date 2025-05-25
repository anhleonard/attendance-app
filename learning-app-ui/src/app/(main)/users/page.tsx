"use client";
import AddUser from "@/components/user/add-user";
import EditUser from "@/components/user/edit-user";
import { ConfirmState, ModalState } from "@/config/types";
import Button from "@/lib/button";
import Pagination from "@/lib/pagination";
import Select from "@/lib/select";
import { openConfirm, closeConfirm } from "@/redux/slices/confirm-slice";
import { openDrawer } from "@/redux/slices/drawer-slice";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Tooltip } from "react-tooltip";
import { Status, Role } from "@/config/enums";
import { openLoading, closeLoading } from "@/redux/slices/loading-slice";
import { openAlert } from "@/redux/slices/alert-slice";
import Label from "@/lib/label";
import moment from "moment";
import { getSystemUsers, updateUser } from "@/apis/services/users";
import { FilterUsersDto, UserResponse, UsersResponse } from "@/apis/dto";
import { RootState } from "@/redux/store";
import { refetch } from "@/redux/slices/refetch-slice";
import TextField from "@/lib/textfield";

const Users = () => {
  const dispatch = useDispatch();
  const [usersData, setUsersData] = useState<UsersResponse>({
    data: [],
    meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
  });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterName, setFilterName] = useState("");
  const [filterRole, setFilterRole] = useState<Role | undefined>(undefined);
  const refetchCount = useSelector((state: RootState) => state.refetch.count);

  const fetchUsers = async (currentPage: number, currentRowsPerPage: number) => {
    try {
      dispatch(openLoading());
      const filterDto: FilterUsersDto = {
        page: currentPage,
        limit: currentRowsPerPage,
        fullname: filterName || undefined,
        role: filterRole,
      };
      const response = await getSystemUsers(filterDto);
      if (response) {
        setUsersData(response);
      }
    } catch (err: any) {
      dispatch(
        openAlert({
          isOpen: true,
          title: "ERROR",
          subtitle: err?.message || "Failed to fetch users",
          type: "error",
        }),
      );
    } finally {
      dispatch(closeLoading());
    }
  };

  useEffect(() => {
    fetchUsers(page, rowsPerPage);
  }, [page, rowsPerPage, refetchCount]);

  const handleFilter = () => {
    setPage(1); // Reset to first page when filtering
    fetchUsers(1, rowsPerPage);
  };

  const handleResetFilter = () => {
    // Reset states and fetch in one go
    const filterDto: FilterUsersDto = {
      page: 1,
      limit: rowsPerPage,
    };

    setFilterName("");
    setFilterRole(undefined);
    setPage(1);

    // Fetch with empty filters directly
    dispatch(openLoading());
    getSystemUsers(filterDto)
      .then((response) => {
        if (response) {
          setUsersData(response);
        }
      })
      .catch((err: any) => {
        dispatch(
          openAlert({
            isOpen: true,
            title: "ERROR",
            subtitle: err?.message || "Failed to reset users list",
            type: "error",
          }),
        );
      })
      .finally(() => {
        dispatch(closeLoading());
      });
  };

  const handleNameChange = (value: string | React.ChangeEvent<HTMLInputElement>) => {
    if (typeof value === "string") {
      setFilterName(value);
    } else {
      setFilterName(value.target.value);
    }
  };

  const handleRoleChange = (value: string) => {
    setFilterRole(value as Role);
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
      title: "Add user",
      content: <AddUser />,
    };

    dispatch(openDrawer(drawer));
  };

  const handleOpenEditDrawer = (user: UserResponse) => {
    const drawer: ModalState = {
      isOpen: true,
      title: "Edit user",
      content: <EditUser userData={user} />,
    };

    dispatch(openDrawer(drawer));
  };

  const handleOpenConfirmChangeStatus = (user: UserResponse) => {
    const confirm: ConfirmState = {
      isOpen: true,
      title: "Are you sure?",
      subtitle: `Are you sure you want to ${user.locked ? "enable" : "disable"} this user?`,
      titleAction: user.locked ? "Enable" : "Disable",
      handleAction: async () => {
        try {
          dispatch(openLoading());
          await updateUser({
            id: user.id,
            locked: !user.locked,
          });

          dispatch(
            openAlert({
              isOpen: true,
              title: "SUCCESS",
              subtitle: `User ${user.locked ? "enabled" : "disabled"} successfully!`,
              type: "success",
            }),
          );
        } catch (error: any) {
          dispatch(
            openAlert({
              isOpen: true,
              title: "ERROR",
              subtitle: error?.message || "Failed to update user status",
              type: "error",
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
        <div className="text-xl font-bold">System users</div>
      </div>
      <div className="flex flex-col">
        <div className="font-bold text-base">1. User list</div>

        {/* filter users */}
        <div className="flex flex-col sm:flex-row gap-4 mb-5 mt-4">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-4">
            <TextField label="Search name" value={filterName} onChange={handleNameChange} />
            <Select
              label="Role"
              defaultValue={filterRole}
              onChange={handleRoleChange}
              options={[
                { label: "Admin", value: Role.ADMIN },
                { label: "Teacher Assistant", value: Role.TA },
              ]}
            />
            <div className="flex flex-row gap-3 items-end">
              <Button label="Filter" className="py-[13px] px-8" status="success" onClick={handleFilter} />
              <Button label="Cancel" className="py-[13px] px-8" status="cancel" onClick={handleResetFilter} />
            </div>
          </div>
          <div className="flex justify-end sm:justify-start">
            <Button
              label="Add user"
              status="success"
              className="py-[13px] px-4 w-full sm:w-auto"
              startIcon={<Image src={"/icons/add-icon.svg"} alt="add-icon" width={20} height={20} />}
              onClick={handleOpenDrawer}
            />
          </div>
        </div>

        {/* table */}
        <div className="max-w-[100%] rounded-[10px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-auto w-full text-left">
              <thead className={`text-grey-c700 uppercase bg-primary-c50`}>
                <tr className="hover:bg-success-c50 hover:text-grey-c700 font-bold">
                  <th className="pl-3 py-4">STT</th>
                  <th className="px-1 py-4">Full Name</th>
                  <th className="px-1 py-4">Email</th>
                  <th className="px-1 py-4">Role</th>
                  <th className="px-1 py-4">Status</th>
                  <th className="px-1 py-4">Created At</th>
                  <th className="px-1 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersData?.data?.map((user, index) => (
                  <tr key={user.id} className="hover:bg-primary-c10 hover:text-grey-c700">
                    <th className="pl-3 py-4">{(page - 1) * rowsPerPage + index + 1}</th>
                    <th className="px-1 py-4">{user.fullname}</th>
                    <th className="px-1 py-4">{user.email}</th>
                    <th className="px-1 py-4">{user.role}</th>
                    <th className="px-1 py-4">
                      <Label
                        status={user.locked ? "error" : "success"}
                        label={user.locked ? Status.INACTIVE : Status.ACTIVE}
                        className="w-[80%]"
                      />
                    </th>
                    <th className="px-1 py-4">{moment(user.createdAt).format("DD/MM/YYYY")}</th>
                    <th className="px-1 py-4 text-center">
                      <div className="flex justify-center items-center gap-3">
                        <button
                          data-tooltip-id={`edit-icon-${user.id}`}
                          data-tooltip-content="Edit"
                          onClick={() => handleOpenEditDrawer(user)}
                        >
                          <Image src="/icons/edit-icon.svg" alt="edit-icon" width={24} height={24} />
                        </button>
                        <Tooltip id={`edit-icon-${user.id}`} />

                        <button
                          data-tooltip-id={`confirm-icon-${user.id}`}
                          data-tooltip-content={user.locked ? "Enable" : "Disable"}
                          onClick={() => handleOpenConfirmChangeStatus(user)}
                        >
                          {user.locked ? (
                            <Image src="/icons/enabled-icon.svg" alt="enabled-icon" width={23} height={23} />
                          ) : (
                            <Image src="/icons/disabled-icon.svg" alt="disabled-icon" width={22} height={22} />
                          )}
                        </button>
                        <Tooltip id={`confirm-icon-${user.id}`} />
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
            totalItems={usersData.meta.total}
            rowsEachPage={rowsPerPage}
            nowPage={page}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
};

export default Users;
