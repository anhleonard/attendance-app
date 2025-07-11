import React, { useState } from "react";
import { Formik, Form, Field, FieldProps } from "formik";
import * as Yup from "yup";
import Button from "@/lib/button";
import TextField from "@/lib/textfield";
import Image from "next/image";
import { ChangePasswordDto } from "@/apis/dto";
import { changePassword } from "@/apis/services/auth";
import { useDispatch } from "react-redux";
import { closeLoading, openLoading } from "@/redux/slices/loading-slice";
import { openAlert } from "@/redux/slices/alert-slice";
import { closeModal } from "@/redux/slices/modal-slice";
import { useRouter } from "next/navigation";
import { ACCESS_TOKEN, USER_INFO } from "@/config/constants";

const validationSchema = Yup.object().shape({
  currentPassword: Yup.string().required("Current password is required"),
  newPassword: Yup.string()
    .required("New password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character",
    ),
  confirmPassword: Yup.string()
    .required("Confirm password is required")
    .oneOf([Yup.ref("newPassword")], "Passwords must match"),
});

const PasswordSetting = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const handleSubmit = async (values: ChangePasswordDto) => {
    try {
      dispatch(openLoading());
      const payload: ChangePasswordDto = {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      };
      await changePassword(payload);
      localStorage.removeItem(ACCESS_TOKEN);
      localStorage.removeItem(USER_INFO);
      dispatch(closeModal());
      router.push("/auth/login");
      dispatch(
        openAlert({
          isOpen: true,
          title: "SUCCESS",
          subtitle: "Password updated successfully.",
          type: "success",
        }),
      );
    } finally {
      dispatch(closeLoading());
    }
  };

  return (
    <Formik
      initialValues={{
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ errors, touched }) => (
        <Form className="text-grey-c900 flex flex-col gap-5 px-2 py-3">
          <Field name="currentPassword">
            {({ field }: FieldProps) => (
              <TextField
                {...field}
                label="Current password"
                inputType={isCurrentPasswordVisible ? "text" : "password"}
                placeholder="Enter your current password"
                error={Boolean(touched.currentPassword && errors.currentPassword)}
                helperText={touched.currentPassword && errors.currentPassword ? errors.currentPassword : undefined}
                endIcon={
                  <button
                    type="button"
                    className="flex items-center justify-center"
                    onClick={() => setIsCurrentPasswordVisible(!isCurrentPasswordVisible)}
                  >
                    {isCurrentPasswordVisible ? (
                      <Image src="/icons/view-on-icon.svg" alt="view-on-icon" width={21} height={21} />
                    ) : (
                      <Image src="/icons/view-off-icon.svg" alt="view-off-icon" width={21} height={21} />
                    )}
                  </button>
                }
              />
            )}
          </Field>

          <Field name="newPassword">
            {({ field }: FieldProps) => (
              <TextField
                {...field}
                label="New password"
                inputType={isNewPasswordVisible ? "text" : "password"}
                placeholder="Enter your new password"
                error={Boolean(touched.newPassword && errors.newPassword)}
                helperText={touched.newPassword && errors.newPassword ? errors.newPassword : undefined}
                endIcon={
                  <button
                    type="button"
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
            )}
          </Field>

          <Field name="confirmPassword">
            {({ field }: FieldProps) => (
              <TextField
                {...field}
                label="Confirm password"
                inputType={isConfirmPasswordVisible ? "text" : "password"}
                placeholder="Enter your confirm password"
                error={Boolean(touched.confirmPassword && errors.confirmPassword)}
                helperText={touched.confirmPassword && errors.confirmPassword ? errors.confirmPassword : undefined}
                endIcon={
                  <button
                    type="button"
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
            )}
          </Field>

          <div className="flex justify-end">
            <Button type="submit" label="Save" className="py-3 px-6" />
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default PasswordSetting;
