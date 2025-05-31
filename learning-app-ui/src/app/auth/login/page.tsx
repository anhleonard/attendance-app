"use client";
import { Class, ModalState, Student, User } from "@/config/types";
import Button from "@/lib/button";
import TextField from "@/lib/textfield";
import { openModal } from "@/redux/slices/modal-slice";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { login } from "@/apis/services/auth";
import { LoginDto } from "@/apis/dto";
import { closeLoading, openLoading } from "@/redux/slices/loading-slice";
import { openAlert } from "@/redux/slices/alert-slice";
import { ACCESS_TOKEN } from "@/config/constants";
import { getSystemUsers, getUserInfo } from "@/apis/services/users";
import { getClasses } from "@/apis/services/classes";
import { Status } from "@/config/enums";
import { getStudents } from "@/apis/services/students";
import { updateSystemInfo } from "@/redux/slices/system-slice";
import { getNotifications } from "@/apis/services/notifications";

const validationSchema = Yup.object({
  email: Yup.string().email("Invalid email format").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

const LoginPage = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        dispatch(openLoading());
        const loginData: LoginDto = {
          email: values.email,
          password: values.password,
        };
        const response = await login(loginData);

        if (response?.token) {
          localStorage.setItem(ACCESS_TOKEN, response.token);
          // get user info
          const userInfo = await getUserInfo();
          // get active classes
          let activeClasses = await getClasses({
            fetchAll: true,
            status: Status.ACTIVE,
          });
          // get active students
          let studentList = await getStudents({
            fetchAll: true,
            status: Status.ACTIVE,
          });
          // get notifications
          const notifications = await getNotifications({
            userId: userInfo?.id,
          });
          // get system users
          let systemUsers = await getSystemUsers({
            fetchAll: true,
            status: Status.ACTIVE,
          });

          if (activeClasses?.data?.length > 0) {
            const mappedActiveClasses = activeClasses?.data?.map((cls: Class) => ({
              label: cls.name,
              value: cls.id.toString(),
            }));
            activeClasses = mappedActiveClasses;
          }
          if (studentList?.data?.length > 0) {
            const mappedActiveStudents = studentList?.data?.map((student: Student) => ({
              label: student.name,
              value: student.id.toString(),
            }));
            studentList = mappedActiveStudents;
          }
          if (systemUsers?.data?.length > 0) {
            const mappedSystemUsers = systemUsers?.data?.map((user: User) => ({
              label: user.fullname,
              value: user.id.toString(),
              role: user.role,
            }));
            systemUsers = mappedSystemUsers;
          }

          dispatch(
            updateSystemInfo({
              profile: userInfo,
              activeClasses: activeClasses || activeClasses?.data || [],
              activeStudents: studentList || studentList?.data || [],
              notifications: {
                data: notifications?.data || [],
                page: 1,
                total: notifications?.total || 0,
              },
              systemUsers: systemUsers || systemUsers?.data || [],
            }),
          );
          router.push("/calendar");
          dispatch(
            openAlert({
              isOpen: true,
              title: "SUCCESS",
              subtitle: "You have successfully logged in!",
              type: "success",
            }),
          );
        }
      } catch (error: any) {
        dispatch(
          openAlert({
            isOpen: true,
            title: "ERROR",
            subtitle: error?.message || "Something went wrong. Please try again.",
            type: "error",
          }),
        );
      } finally {
        dispatch(closeLoading());
      }
    },
  });

  const handleShowModal = () => {
    const modal: ModalState = {
      title: "Forgot Password",
      content: <ForgotPasswordModal />,
      isOpen: true,
      className: "max-w-xl",
    };
    dispatch(openModal(modal));
  };

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
          <div className="text-2xl font-bold text-grey-c400">LOGIN</div>
          <div className="flex flex-col items-center justify-center gap-4 w-full px-8">
            <form onSubmit={formik.handleSubmit} className="w-full flex flex-col gap-4">
              <div className="w-full">
                <TextField
                  label="Email"
                  className="w-full"
                  startIcon={<Image src="/icons/mail-icon.svg" alt="mail-icon" width={20} height={20} />}
                  placeholder="Enter your email"
                  name="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={Boolean(formik.touched.email && formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email ? String(formik.errors.email) : undefined}
                />
              </div>
              <div className="w-full">
                <TextField
                  label="Password"
                  className="w-full"
                  startIcon={<Image src="/icons/lock-icon.svg" alt="lock-icon" width={21} height={21} />}
                  endIcon={
                    <button
                      type="button"
                      className="flex items-center justify-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <Image
                        src={showPassword ? "/icons/view-icon.svg" : "/icons/view-off.svg"}
                        alt="view-icon"
                        width={21}
                        height={21}
                      />
                    </button>
                  }
                  inputType={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  name="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={Boolean(formik.touched.password && formik.errors.password)}
                  helperText={
                    formik.touched.password && formik.errors.password ? String(formik.errors.password) : undefined
                  }
                />
              </div>
              <div className="w-full flex justify-end">
                <Link href="/auth/forgot-password" className="text-primary-c900 text-sm hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="w-full">
                <Button
                  type="submit"
                  label={isLoading ? "Logging in..." : "Login"}
                  className="py-3 w-full"
                  disabled={isLoading}
                />
              </div>
            </form>
            <div className="text-grey-c400 text-sm">
              Don't have an account?{" "}
              <Link href="/auth/register" className="text-primary-c900 underline">
                Register
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

const ForgotPasswordModal = () => {
  return (
    <div className="flex flex-col gap-4 py-4 px-3">
      <TextField
        label="Email"
        className="w-full"
        startIcon={<Image src="/icons/mail-icon.svg" alt="mail-icon" width={20} height={20} />}
        placeholder="Enter your email"
      />
      <div className="flex justify-end">
        <Button label="Send" className="py-3 w-32" />
      </div>
    </div>
  );
};
