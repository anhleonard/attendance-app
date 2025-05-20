"use client";
import AddUser from "@/components/user/add-user";
import EditUser from "@/components/user/edit-user";
import { ConfirmState, ModalState } from "@/config/types";
import Button from "@/lib/button";
import Pagination from "@/lib/pagination";
import Select from "@/lib/select";
import { openConfirm } from "@/redux/slices/confirm-slice";
import { openDrawer } from "@/redux/slices/drawer-slice";
import Image from "next/image";
import React from "react";
import { useDispatch } from "react-redux";
import { Tooltip } from "react-tooltip";

const Users = () => {
  const dispatch = useDispatch();

  const handleOpenDrawer = () => {
    const drawer: ModalState = {
      isOpen: true,
      title: "Add user",
      content: <AddUser />,
    };

    dispatch(openDrawer(drawer));
  };

  const handleOpenEditDrawer = (userId: number) => {
    const drawer: ModalState = {
      isOpen: true,
      title: "Edit user",
      content: <EditUser userId={userId} />,
    };

    dispatch(openDrawer(drawer));
  };

  const handleOpenConfirmDelete = () => {
    const confirm: ConfirmState = {
      isOpen: true,
      title: "Are you sure?",
      subtitle: "This action cannot be undone. All values associated with this user will be lost.",
      titleAction: "Delete",
      handleAction: () => {},
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
        <div className="grid grid-cols-6 gap-3 mb-5 mt-4">
          <div className="col-span-4 grid sm:grid-cols-4 sm:gap-3">
            <div className="sm:col-span-2">
              <Select
                label="Select user"
                options={[
                  { label: "Admin User", value: "ADMIN" },
                  { label: "TA User", value: "TA" },
                ]}
                defaultValue="ADMIN"
              />
            </div>
            <Select
              label="Role"
              options={[
                { label: "Admin", value: "ADMIN" },
                { label: "Teacher Assistant", value: "TA" },
              ]}
            />
          </div>
          <div className="col-span-2 text-end">
            <div className="inline-grid justify-center items-center">
              <Button
                label="Add user"
                status="success"
                className="py-3 px-4"
                startIcon={<Image src={"/icons/add-icon.svg"} alt="add-icon" width={20} height={20} />}
                onClick={handleOpenDrawer}
              />
            </div>
          </div>
        </div>

        {/* table */}
        <div className="max-w-[100%] rounded-[10px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-auto w-full text-left">
              <thead className={`text-grey-c700 uppercase bg-primary-c50`}>
                <tr className="hover:bg-success-c50 hover:text-grey-c700 font-bold">
                  <th className="pl-3 py-4">STT</th>
                  <th className="px-1 py-4">Username</th>
                  <th className="px-1 py-4">Full Name</th>
                  <th className="px-1 py-4">Email</th>
                  <th className="px-1 py-4">Role</th>
                  <th className="px-1 py-4">Status</th>
                  <th className="px-1 py-4">Created At</th>
                  <th className="px-1 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-primary-c10 hover:text-grey-c700">
                  <th className="pl-3 py-4">1</th>
                  <th className="px-1 py-4 font-questrial text-grey-c900 text-[15px]">admin</th>
                  <th className="px-1 py-4">System Administrator</th>
                  <th className="px-1 py-4">admin@example.com</th>
                  <th className="px-1 py-4">ADMIN</th>
                  <th className="px-1 py-4">Active</th>
                  <th className="px-1 py-4">2024-03-20</th>
                  <th className="px-1 py-4 text-center">
                    <div className="flex justify-center items-center gap-3">
                      <button
                        data-tooltip-id="edit-icon"
                        data-tooltip-content="Edit"
                        onClick={() => handleOpenEditDrawer(1)}
                      >
                        <Image src="/icons/edit-icon.svg" alt="edit-icon" width={24} height={24} />
                      </button>
                      <Tooltip id="edit-icon" />

                      <button
                        data-tooltip-id="delete-icon"
                        data-tooltip-content="Delete"
                        onClick={handleOpenConfirmDelete}
                      >
                        <Image src="/icons/delete-icon.svg" alt="delete-icon" width={24} height={24} />
                      </button>
                      <Tooltip id="delete-icon" />
                    </div>
                  </th>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-5">
          <Pagination
            totalItems={50}
            onPageChange={(page: number, rowsPerPage: number) => console.log({ page, rowsPerPage })}
          />
        </div>
      </div>
    </div>
  );
};

export default Users;
