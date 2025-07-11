"use client";
import { useFormik } from "formik";
import * as Yup from "yup";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useDispatch } from "react-redux";
import Button from "@/lib/button";
import TextField from "@/lib/textfield";
import { openAlert } from "@/redux/slices/alert-slice";
import { closeLoading, openLoading } from "@/redux/slices/loading-slice";
import { useAuthClear } from "@/hooks/useAuthClear";
import { resetPassword } from "@/apis/services/auth";

const validationSchema = Yup.object({
  newPassword: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    )
    .required("New password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "Passwords must match")
    .required("Confirm password is required"),
});

const ResetPasswordPage = () => {
  const router = useRouter();
  const params = useParams();
  const dispatch = useDispatch();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Clear auth data when component mounts
  useAuthClear();

  // Get token from URL params (the folder name serves as the token)
  const token = (params?.token as string) || "a1b2c3d4e5f678901234567890123456";

  const formik = useFormik({
    initialValues: {
      newPassword: "",
      confirmPassword: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        dispatch(openLoading());

        await resetPassword({
          token: token,
          newPassword: values.newPassword,
        });

        // Redirect to login page after successful password reset
        router.push("/auth/login");

        dispatch(
          openAlert({
            isOpen: true,
            title: "SUCCESS",
            subtitle: "Your password has been successfully reset! You can now login with your new password.",
            type: "success",
          }),
        );
      } finally {
        dispatch(closeLoading());
      }
    },
  });

  return (
    <div className="bg-white h-screen text-grey-c900 grid md:grid-cols-7">
      {/* left content */}
      <div className="hidden md:block relative w-full h-full col-span-3">
        <Image
          src={"/images/auth-bg.png"}
          alt="auth-background"
          fill
          className="object-cover p-4 rounded-[30px] object-[65%_75%]"
        />
      </div>
      {/* right content */}
      <div className="md:col-span-4 flex flex-col items-center mt-20 2xl:mt-40 w-full flex-shrink-0">
        <div className="flex flex-col items-center justify-center gap-6 mb-12">
          <div className="text-2xl font-bold text-grey-c700">WELCOME TO</div>
          <div className="text-5xl font-extrabold text-primary-c900">ATTENDANCE</div>
        </div>
        <div className="flex flex-col items-center justify-center gap-6 w-2/3">
          <div className="text-2xl font-bold text-grey-c400">RESET PASSWORD</div>
          <div className="flex flex-col items-center justify-center gap-4 w-full px-8">
            <form onSubmit={formik.handleSubmit} className="w-full flex flex-col gap-4">
              <div className="w-full">
                <TextField
                  label="New password"
                  className="w-full"
                  startIcon={<Image src="/icons/lock-icon.svg" alt="lock-icon" width={21} height={21} />}
                  endIcon={
                    <button
                      type="button"
                      className="flex items-center justify-center"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      <Image
                        src={showNewPassword ? "/icons/view-icon.svg" : "/icons/view-off.svg"}
                        alt="view-icon"
                        width={21}
                        height={21}
                      />
                    </button>
                  }
                  inputType={showNewPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  name="newPassword"
                  value={formik.values.newPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={Boolean(formik.touched.newPassword && formik.errors.newPassword)}
                  helperText={
                    formik.touched.newPassword && formik.errors.newPassword
                      ? String(formik.errors.newPassword)
                      : undefined
                  }
                />
              </div>
              <div className="w-full">
                <TextField
                  label="Confirm new password"
                  className="w-full"
                  startIcon={<Image src="/icons/lock-icon.svg" alt="lock-icon" width={21} height={21} />}
                  endIcon={
                    <button
                      type="button"
                      className="flex items-center justify-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <Image
                        src={showConfirmPassword ? "/icons/view-icon.svg" : "/icons/view-off.svg"}
                        alt="view-icon"
                        width={21}
                        height={21}
                      />
                    </button>
                  }
                  inputType={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your new password"
                  name="confirmPassword"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={Boolean(formik.touched.confirmPassword && formik.errors.confirmPassword)}
                  helperText={
                    formik.touched.confirmPassword && formik.errors.confirmPassword
                      ? String(formik.errors.confirmPassword)
                      : undefined
                  }
                />
              </div>
              <div className="w-full">
                <Button type="submit" className="py-3 w-full" />
              </div>
            </form>
            <div className="text-grey-c400 text-sm">
              Remember your password?{" "}
              <Link href="/auth/login" className="text-primary-c900 underline">
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
