import React, { useState } from "react";
import Button from "@/lib/button";
import TextField from "@/lib/textfield";
import Image from "next/image";

const PasswordSetting = () => {
  const [isOldPasswordVisible, setIsOldPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  return (
    <div className="text-grey-c900 flex flex-col gap-5 px-2 py-3">
      <TextField
        label="Old password"
        defaultValue=""
        inputType={isOldPasswordVisible ? "text" : "password"}
        placeholder="Enter your old password"
        endIcon={
          <button
            className="flex items-center justify-center"
            onClick={() => setIsOldPasswordVisible(!isOldPasswordVisible)}
          >
            {isOldPasswordVisible ? (
              <Image src="/icons/view-on-icon.svg" alt="view-on-icon" width={21} height={21} />
            ) : (
              <Image src="/icons/view-off-icon.svg" alt="view-off-icon" width={21} height={21} />
            )}
          </button>
        }
      />
      <TextField
        label="New password"
        defaultValue=""
        inputType={isNewPasswordVisible ? "text" : "password"}
        placeholder="Enter your new password"
        endIcon={
          <button
            className="flex items-center justify-center"
            onClick={() => setIsNewPasswordVisible(!isNewPasswordVisible)}
          >
            {isNewPasswordVisible ? (
              <Image src="/icons/view-on-icon.svg" alt="view-on-icon" width={21} height={21} />
            ) : (
              <Image src="/icons/view-off-icon.svg" alt="view-off-icon" width={21} height={21} />
            )}
          </button>
        }
      />
      <TextField
        label="Confirm password"
        defaultValue=""
        inputType={isConfirmPasswordVisible ? "text" : "password"}
        placeholder="Enter your confirm password"
        endIcon={
          <button
            className="flex items-center justify-center"
            onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
          >
            {isConfirmPasswordVisible ? (
              <Image src="/icons/view-on-icon.svg" alt="view-on-icon" width={21} height={21} />
            ) : (
              <Image src="/icons/view-off-icon.svg" alt="view-off-icon" width={21} height={21} />
            )}
          </button>
        }
      />
      <div className="flex justify-end">
        <Button label="Save" className="py-2.5 px-6" />
      </div>
    </div>
  );
};

export default PasswordSetting;
