import React from "react";
import { Notification } from "@/config/types";
import Image from "next/image";
import Button from "@/lib/button";
import { useDispatch } from "react-redux";
import { closeModal } from "@/redux/slices/modal-slice";
import moment from "moment";

const NotificationDetailModal = ({ notification }: { notification: Notification }) => {
  const dispatch = useDispatch();
  const handleClose = () => {
    dispatch(closeModal());
  };
  return (
    <div className="flex flex-col gap-4 px-3 py-2">
      <div className="px-3 py-2.5 flex flex-row items-start justify-between bg-primary-c50 rounded-xl">
        <div className="flex flex-row items-center gap-2 mt-1">
          <Image src="/icons/ring-icon.svg" alt="ring-icon" width={20} height={20} />
          <div className="text-grey-c900">Created by</div>
        </div>
        <div className="text-primary-c900 font-medium max-w-[70%] break-words">
          {`${notification?.createdBy?.fullname} (${notification?.createdBy?.role})` || "--"}
        </div>
      </div>
      <div className="px-3 py-2.5 flex flex-row items-start justify-between bg-primary-c50 rounded-xl">
        <div className="flex flex-row items-center gap-2 mt-1">
          <Image src="/icons/ring-icon.svg" alt="ring-icon" width={20} height={20} />
          <div className="text-grey-c900">Created at</div>
        </div>
        <div className="text-primary-c900 font-medium max-w-[70%] break-words">
          {notification?.createdAt ? moment(notification?.createdAt).format("DD/MM/YYYY HH:mm") : "--"}
        </div>
      </div>
      <div className="px-3 py-2.5 flex flex-row items-start justify-between bg-primary-c50 rounded-xl">
        <div className="flex flex-row items-center gap-2 mt-1">
          <Image src="/icons/ring-icon.svg" alt="ring-icon" width={20} height={20} />
          <div className="text-grey-c900">Title</div>
        </div>
        <div className="text-primary-c900 font-medium max-w-[70%] break-words">{notification?.title || "--"}</div>
      </div>
      <div className="px-3 py-2.5 bg-primary-c50 rounded-xl">
        <div className="text-black/80 break-words whitespace-pre-wrap">{notification?.message || "--"}</div>
      </div>
      <div className="flex flex-row justify-end">
        <Button label="Close" className="py-[13px] px-8" status="cancel" onClick={handleClose} />
      </div>
    </div>
  );
};

export default NotificationDetailModal;
