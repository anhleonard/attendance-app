"use client";
import Divider from "@/lib/divider";
import { RootState } from "@/redux/store";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { useSelector } from "react-redux";

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useSelector((state: RootState) => state.system);

  return (
    <div className="w-[260px] h-full bg-white border-r border-grey-c100 overflow-y-auto hidden md:block">
      <div className="flex flex-col gap-2 justify-center items-center py-6">
        {profile?.avatar ? (
          <div className="w-[60px] h-[60px] rounded-full overflow-hidden">
            <Image 
              src={profile.avatar} 
              alt="User avatar" 
              width={500} 
              height={500} 
              quality={100}
              className="w-full h-full object-cover rounded-full"
              priority
            />
          </div>
        ) : (
          <div className="w-[60px] h-[60px] rounded-full bg-primary-c50 text-primary-c900 flex items-center justify-center font-semibold text-lg">
            {profile?.fullname?.substring(0, 2).toUpperCase()}
          </div>
        )}
        <div className="font-bold text-grey-c900 text-base">{profile?.fullname}</div>
      </div>
      <Divider />
      <div className="flex flex-col p-3 gap-3">
        {/* Assistant  */}
        <div
          className={`flex flex-row px-4 py-3.5 items-center gap-2 active:bg-primary-c300 hover:bg-primary-c200 cursor-pointer rounded-xl duration-300 transition ${
            pathname === "/assistant" ? "bg-primary-c100" : ""
          }`}
          onClick={() => router.push("/assistant")}
        >
          <Image src="/icons/assistant-icon.svg" alt="assistant-icon" width={23} height={23} />
          <div className="font-semibold text-primary-c900">Assistant</div>
        </div>
        {/* Attendance  */}
        <div
          className={`flex flex-row px-4 py-3.5 items-center gap-2 active:bg-primary-c300 hover:bg-primary-c200 cursor-pointer rounded-xl duration-300 transition ${
            pathname === "/attendance" ? "bg-primary-c100" : ""
          }`}
          onClick={() => router.push("/attendance")}
        >
          <Image src="/icons/attendance-icon.svg" alt="attendance-icon" width={24} height={24} />
          <div className="font-semibold text-primary-c900">Attendance</div>
        </div>
        {/* Calendar */}
        <div
          className={`flex flex-row px-4 py-3.5 items-center gap-2 active:bg-primary-c300 hover:bg-primary-c200 cursor-pointer rounded-xl duration-300 transition ${
            pathname === "/calendar" ? "bg-primary-c100" : ""
          }`}
          onClick={() => router.push("/calendar")}
        >
          <Image src="/icons/solid-calendar.svg" alt="solid-calendar" width={24} height={24} />
          <div className="font-semibold text-primary-c900">Calendar</div>
        </div>
        {/* Classes */}
        <div
          className={`flex flex-row px-4 py-3.5 items-center gap-2 active:bg-primary-c300 hover:bg-primary-c200 cursor-pointer rounded-xl duration-300 transition ${
            pathname === "/classes" ? "bg-primary-c100" : ""
          }`}
          onClick={() => router.push("/classes")}
        >
          <Image src="/icons/class-icon.svg" alt="class-icon" width={24} height={24} />
          <div className="font-semibold text-primary-c900">Classes</div>
        </div>
        {/* Students */}
        <div
          className={`flex flex-row px-4 py-3.5 items-center gap-2 active:bg-primary-c300 hover:bg-primary-c200 cursor-pointer rounded-xl duration-300 transition ${
            pathname === "/students" ? "bg-primary-c100" : ""
          }`}
          onClick={() => router.push("/students")}
        >
          <Image src="/icons/student-icon.svg" alt="student-icon" width={24} height={24} />
          <div className="font-semibold text-primary-c900">Students</div>
        </div>
        {/* Payments */}
        <div
          className={`flex flex-row px-4 py-3.5 items-center gap-2 active:bg-primary-c300 hover:bg-primary-c200 cursor-pointer rounded-xl duration-300 transition ${
            pathname === "/payments" ? "bg-primary-c100" : ""
          }`}
          onClick={() => router.push("/payments")}
        >
          <Image src="/icons/payment-icon.svg" alt="payment-icon" width={26} height={26} />
          <div className="font-semibold text-primary-c900">Payments</div>
        </div>
        {/* Histories */}
        <div
          className={`flex flex-row px-4 py-3.5 items-center gap-2 active:bg-primary-c300 hover:bg-primary-c200 cursor-pointer rounded-xl duration-300 transition ${
            pathname === "/histories" ? "bg-primary-c100" : ""
          }`}
          onClick={() => router.push("/histories")}
        >
          <Image src="/icons/statistic-icon.svg" alt="statistic-icon" width={24} height={24} />
          <div className="font-semibold text-primary-c900">Histories</div>
        </div>
        {/* System Users */}
        <div
          className={`flex flex-row px-4 py-3.5 items-center gap-2 active:bg-primary-c300 hover:bg-primary-c200 cursor-pointer rounded-xl duration-300 transition ${
            pathname === "/users" ? "bg-primary-c100" : ""
          }`}
          onClick={() => router.push("/users")}
        >
          <Image src="/icons/system-user.svg" alt="system-user" width={24} height={24} />
          <div className="font-semibold text-primary-c900">System users</div>
        </div>
      </div>
      <Divider />
    </div>
  );
};

export default Sidebar;
