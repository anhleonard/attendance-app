"use client";
import PasswordSetting from "@/components/header/password-setting";
import ProfileSetting from "@/components/header/profile-setting";
import { ModalState } from "@/config/types";
import { openModal } from "@/redux/slices/modal-slice";
import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";

const Header = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleOpenProfileModal = () => {
    const modal: ModalState = {
      isOpen: true,
      title: "Profile setting",
      content: <ProfileSetting />,
      className: "max-w-xl",
    };
    setIsDropdownOpen(!isDropdownOpen);
    dispatch(openModal(modal));
  };

  const handleOpenPasswordModal = () => {
    const modal: ModalState = {
      isOpen: true,
      title: "Password setting",
      content: <PasswordSetting />,
      className: "max-w-xl",
    };
    setIsDropdownOpen(!isDropdownOpen);
    dispatch(openModal(modal));
  };

  const handleLogout = () => {
    // TODO: Add your logout logic here (clear tokens, etc)
    setIsDropdownOpen(false);
    router.push("/auth/login");
  };

  return (
    <div className="bg-white py-3 px-8 border-b border-grey-c100">
      <div className="w-full flex flex-row items-center justify-between">
        <div className="font-bold text-grey-c900 text-lg">Attendance Tool</div>
        <div className="flex flex-row items-center gap-2">
          <button className="p-2 rounded-full bg-primary-c50 hover:bg-primary-c100 text-grey-c900 hover:text-primary-c900 duration-300 transition-all">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M2.10832 12.3084C1.93082 13.4701 2.72332 14.2759 3.69332 14.6776C7.41248 16.2192 12.5875 16.2192 16.3067 14.6776C17.2767 14.2759 18.0692 13.4692 17.8917 12.3084C17.7833 11.5942 17.2442 11.0001 16.845 10.4192C16.3225 9.64925 16.2708 8.81008 16.27 7.91675C16.2708 4.46508 13.4642 1.66675 9.99998 1.66675C6.53582 1.66675 3.72915 4.46508 3.72915 7.91675C3.72915 8.81008 3.67748 9.65008 3.15415 10.4192C2.75582 11.0001 2.21748 11.5942 2.10832 12.3084Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6.66663 15.8335C7.04829 17.271 8.39663 18.3335 9.99996 18.3335C11.6041 18.3335 12.9508 17.271 13.3333 15.8335"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="p-2 rounded-full bg-primary-c50 hover:bg-primary-c100 text-grey-c900 hover:text-primary-c900 duration-300 transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M17.765 5.95094L17.3534 5.23761C17.0425 4.69761 16.8867 4.42761 16.6217 4.32011C16.3575 4.21177 16.0584 4.29761 15.4592 4.46677L14.4425 4.75344C14.06 4.84177 13.6592 4.79177 13.3109 4.61177L13.03 4.45011C12.7308 4.25837 12.5007 3.97602 12.3734 3.64427L12.095 2.81261C11.9117 2.26261 11.82 1.98761 11.6025 1.83094C11.385 1.67261 11.095 1.67261 10.5167 1.67261H9.58752C9.00919 1.67261 8.72002 1.67261 8.50169 1.83094C8.28419 1.98761 8.19336 2.26261 8.01002 2.81261L7.73169 3.64427C7.60409 3.97614 7.3737 4.25851 7.07419 4.45011L6.79336 4.61261C6.44502 4.79177 6.04336 4.84177 5.66169 4.75427L4.64502 4.46677C4.04586 4.29761 3.74669 4.21261 3.48252 4.32011C3.21752 4.42761 3.06169 4.69761 2.75086 5.23677L2.34002 5.95094C2.04836 6.45761 1.90252 6.71011 1.93086 6.97927C1.95919 7.24927 2.15419 7.46594 2.54419 7.90011L3.40336 8.86094C3.61336 9.12677 3.76252 9.59011 3.76252 10.0068C3.76252 10.4234 3.61336 10.8868 3.40419 11.1526L2.54419 12.1126C2.15419 12.5468 1.95919 12.7643 1.93086 13.0334C1.90252 13.3026 2.04752 13.5559 2.33919 14.0618L2.75086 14.7759C3.06169 15.3151 3.21752 15.5851 3.48252 15.6926C3.74752 15.8001 4.04586 15.7159 4.64502 15.5459L5.66169 15.2593C6.0441 15.1717 6.44513 15.2219 6.79419 15.4009L7.07419 15.5626C7.37419 15.7543 7.60419 16.0376 7.73086 16.3693L8.00919 17.2001C8.19252 17.7501 8.28419 18.0251 8.50169 18.1834C8.72002 18.3401 9.00919 18.3401 9.58752 18.3401H10.5167C11.095 18.3401 11.385 18.3401 11.6025 18.1826C11.82 18.0251 11.9117 17.7501 12.0942 17.2001L12.3734 16.3693C12.5 16.0368 12.73 15.7543 13.03 15.5626L13.31 15.4009C13.66 15.2218 14.06 15.1709 14.4434 15.2593L15.46 15.5459C16.0584 15.7159 16.3575 15.8009 16.6217 15.6934C16.8867 15.5851 17.0425 15.3151 17.3534 14.7759L17.7642 14.0618C18.0559 13.5559 18.2017 13.3034 18.1734 13.0334C18.145 12.7634 17.95 12.5468 17.56 12.1126L16.7009 11.1526C16.4909 10.8859 16.3417 10.4234 16.3417 10.0068C16.3417 9.59011 16.4909 9.12677 16.7 8.86094L17.56 7.90011C17.95 7.46677 18.145 7.24927 18.1734 6.97927C18.2017 6.70927 18.0567 6.45761 17.765 5.95094Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12.9334 10.0002C12.9334 10.7737 12.6261 11.5156 12.0791 12.0626C11.5321 12.6095 10.7903 12.9168 10.0167 12.9168C9.24316 12.9168 8.50129 12.6095 7.95431 12.0626C7.40733 11.5156 7.10004 10.7737 7.10004 10.0002C7.10004 9.22661 7.40733 8.48475 7.95431 7.93777C8.50129 7.39079 9.24316 7.0835 10.0167 7.0835C10.7903 7.0835 11.5321 7.39079 12.0791 7.93777C12.6261 8.48475 12.9334 9.22661 12.9334 10.0002Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            <div
              className={`z-[999] absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-grey-c100 overflow-hidden transition-all duration-200 transform origin-top-right ${
                isDropdownOpen
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
              }`}
            >
              <button
                onClick={handleOpenProfileModal}
                className="flex flex-row items-center gap-2 w-full px-4 py-2.5 text-left text-grey-c900 hover:bg-primary-c50 active:bg-primary-c100 hover:text-primary-c900 transition-colors duration-200"
              >
                <svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M6.79315 6.5625C6.79315 9.01875 8.79003 11.0156 11.2463 11.0156C13.7025 11.0156 15.6994 9.01875 15.6994 6.5625C15.6994 4.10625 13.7025 2.10938 11.2463 2.10938C8.79003 2.10938 6.79315 4.10625 6.79315 6.5625ZM8.1994 6.5625C8.1994 4.88438 9.56815 3.51562 11.2463 3.51562C12.9244 3.51562 14.2932 4.88438 14.2932 6.5625C14.2932 8.24062 12.9244 9.60938 11.2463 9.60938C9.56815 9.60938 8.1994 8.24062 8.1994 6.5625ZM3.98065 17.8125C3.98065 19.2375 5.13378 20.3906 6.55878 20.3906H15.9338C17.3588 20.3906 18.5119 19.2375 18.5119 17.8125C18.5119 14.8406 16.0932 12.4219 13.1213 12.4219H9.37128C6.3994 12.4219 3.98065 14.8406 3.98065 17.8125ZM5.3869 17.8125C5.38938 16.7565 5.80995 15.7445 6.55663 14.9979C7.30331 14.2512 8.31532 13.8306 9.37128 13.8281H13.1213C14.1772 13.8306 15.1892 14.2512 15.9359 14.9979C16.6826 15.7445 17.1032 16.7565 17.1057 17.8125C17.1057 18.4594 16.5807 18.9844 15.9338 18.9844H6.55878C5.9119 18.9844 5.3869 18.4594 5.3869 17.8125Z"
                    fill="currentColor"
                  />
                </svg>
                <div>Profile</div>
              </button>
              <button
                onClick={handleOpenPasswordModal}
                className="flex flex-row items-center gap-2 w-full px-4 py-2.5 text-left text-grey-c900 hover:bg-primary-c50 active:bg-primary-c100 hover:text-primary-c900 transition-colors duration-200"
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M13.2834 14.2081H13.2917M8.70835 14.2081H8.7166M3.91235 17.2744C4.1186 18.8052 5.38635 20.0051 6.93002 20.0757C8.22802 20.1353 9.5471 20.1665 11 20.1665C12.4529 20.1665 13.772 20.1353 15.07 20.0748C16.6137 20.0051 17.8814 18.8052 18.0877 17.2744C18.2224 16.2752 18.3334 15.2513 18.3334 14.2081C18.3334 13.165 18.2224 12.1411 18.0877 11.1419C17.8814 9.61106 16.6137 8.41114 15.07 8.34056C13.7142 8.2786 12.3572 8.24834 11 8.24981C9.5471 8.24981 8.22802 8.28097 6.93002 8.34147C5.38635 8.41114 4.1186 9.61106 3.91235 11.1419C3.77669 12.1411 3.66669 13.165 3.66669 14.2081C3.66669 15.2513 3.7776 16.2752 3.91235 17.2744Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6.875 8.24992V5.95825C6.875 4.86423 7.3096 3.81502 8.08318 3.04144C8.85677 2.26785 9.90598 1.83325 11 1.83325C12.094 1.83325 13.1432 2.26785 13.9168 3.04144C14.6904 3.81502 15.125 4.86423 15.125 5.95825V8.24992"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div>Change password</div>
              </button>
              <button
                onClick={handleLogout}
                className="flex flex-row items-center gap-2 w-full px-4 py-2.5 text-left text-grey-c900 hover:bg-primary-c50 active:bg-primary-c100 hover:text-primary-c900 transition-colors duration-200"
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M13.75 16.1562C13.6822 17.8538 12.2678 19.2948 10.373 19.249C9.93208 19.238 9.38667 19.084 8.29675 18.7769C5.67417 18.0372 3.39717 16.7932 2.85083 14.0084C2.75 13.496 2.75 12.9194 2.75 11.7672V10.2327C2.75 9.0804 2.75 8.50382 2.85083 7.9914C3.39717 5.20657 5.67417 3.96265 8.29675 3.2229C9.38758 2.91582 9.93208 2.76182 10.373 2.75082C12.2678 2.70499 13.6822 4.14599 13.75 5.84365"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9.16669 10.9999H19.25M9.16669 10.9999C9.16669 10.3583 10.9945 9.15925 11.4584 8.70825M9.16669 10.9999C9.16669 11.6416 10.9945 12.8406 11.4584 13.2916"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div>Log out</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
