import Label from "@/lib/label";
import Image from "next/image";
import React from "react";
import { SessionKey } from "@/config/enums";
import { Class, Session } from "@/config/types";
import { getDayBySessionKey } from "@/config/functions";
import { SESSION_KEYS } from "@/config/constants";
import moment from "moment";

interface Props {
  classItem: Class;
}

const DetailClassModal = ({ classItem }: Props) => {
  const calculateDuration = (startTime: string, endTime: string): string => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffInHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return `${diffInHours} hours`;
  };

  // Sort sessions by day order: Monday to Sunday
  const sortSessionsByDay = (sessions: Session[]): Session[] => {
    return [...sessions].sort((a, b) => {
      const aIndex = SESSION_KEYS.indexOf(a.sessionKey);
      const bIndex = SESSION_KEYS.indexOf(b.sessionKey);
      return aIndex - bIndex;
    });
  };

  const sortedSessions = sortSessionsByDay(classItem.sessions);

  return (
    <div className="flex flex-col gap-4">
      {/* 1. */}
      <div className="flex flex-col gap-1">
        <div className="flex flex-row items-center justify-between">
          <div className="font-semibold text-primary-c900">1. General information</div>
          <Label status={classItem.status === "ACTIVE" ? "success" : "error"} label={classItem.status} />
        </div>
        <div className="py-2 px-4 flex flex-col gap-2">
          {/* 1. Name */}
          <div className="px-3 py-2.5 flex flex-row items-center justify-between bg-primary-c50 rounded-xl">
            <div className="flex flex-row items-center gap-2">
              <Image src="/icons/name-icon.svg" alt="name-icon" width={20} height={20} />
              <div className="text-grey-c900">Name</div>
            </div>
            <div className="text-grey-c700">{classItem.name}</div>
          </div>

          {/* 2. Created at */}
          <div className="px-3 py-2.5 flex flex-row items-center justify-between bg-primary-c50 rounded-xl">
            <div className="flex flex-row items-center gap-2">
              <Image src="/icons/created-icon.svg" alt="created-icon" width={20} height={20} />
              <div className="text-grey-c900">Created at</div>
            </div>
            <div className="text-grey-c700">{moment(classItem.createdAt).format("DD/MM/YYYY")}</div>
          </div>

          {/* 2. Sessions per week */}
          <div className="px-3 py-2.5 flex flex-row items-center justify-between bg-primary-c50 rounded-xl">
            <div className="flex flex-row items-center gap-2">
              <Image src="/icons/ring-icon.svg" alt="ring-icon" width={20} height={20} />
              <div className="text-grey-c900">Total sessions</div>
            </div>
            <div className="text-grey-c700">{classItem.sessions.length}</div>
          </div>
        </div>
      </div>

      {/* 2. */}
      <div className="flex flex-col gap-1">
        <div className="flex flex-row items-center justify-between">
          <div className="font-semibold text-primary-c900">2. Description</div>
        </div>
        <div className="py-2 px-4 flex flex-col gap-2">
          <div className="px-3 py-2.5 flex flex-row items-center justify-between bg-primary-c50 rounded-xl">
            <div className="text-grey-c900">{classItem.description}</div>
          </div>
        </div>
      </div>

      {/* 3. */}
      <div className="flex flex-col gap-1">
        <div className="flex flex-row items-center justify-between">
          <div className="font-semibold text-primary-c900">3. Detail sessions</div>
        </div>
        <div className="py-2 px-4 flex flex-col gap-3">
          {sortedSessions.map((session: Session, index: number) => (
            <div key={session.id} className="px-3 py-3 bg-primary-c50 rounded-xl text-grey-c900">
              {/* title */}
              <div className="font-semibold mb-2">Session {index + 1}</div>
              {/* detail information */}
              <div className="grid grid-cols-2 gap-4 bg-white px-4 py-4 rounded-[10px]">
                {/* 1. */}
                <div className="flex flex-row gap-2 items-start">
                  <Image src="/icons/day-icon.svg" alt="day-icon" width={24} height={24} />
                  <div className="flex flex-col">
                    <div className="text-xs text-grey-c300">Day</div>
                    <div className="text-grey-c900 font-bold">
                      {getDayBySessionKey(session.sessionKey)?.charAt(0) +
                        getDayBySessionKey(session.sessionKey)?.slice(1).toLowerCase()}
                    </div>
                  </div>
                </div>

                {/* 2. */}
                <div className="flex flex-row gap-2 items-start">
                  <Image src="/icons/duration-icon.svg" alt="duration-icon" width={24} height={24} />
                  <div className="flex flex-col">
                    <div className="text-xs text-grey-c300">Duration</div>
                    <div className="text-grey-c900 font-bold">
                      {calculateDuration(session.startTime, session.endTime)}
                    </div>
                  </div>
                </div>

                {/* 3. */}
                <div className="flex flex-row gap-2 items-start">
                  <Image src="/icons/time-icon.svg" alt="time-icon" width={24} height={24} />
                  <div className="flex flex-col">
                    <div className="text-xs text-grey-c300">Time</div>
                    <div className="text-grey-c900 font-bold">
                      {session.startTime} - {session.endTime}
                    </div>
                  </div>
                </div>

                {/* 4. */}
                <div className="flex flex-row gap-2 items-start">
                  <Image src="/icons/price-icon.svg" alt="price-icon" width={24} height={24} />
                  <div className="flex flex-col">
                    <div className="text-xs text-grey-c300">Price</div>
                    <div className="text-grey-c900 font-bold">{session.amount.toLocaleString()} VND</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DetailClassModal;
