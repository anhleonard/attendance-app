"use client";
import { Class, ModalState, Student, User } from "@/config/types";
import Button from "@/lib/button";
import TextField from "@/lib/textfield";
import { closeModal, openModal } from "@/redux/slices/modal-slice";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { login, forgotPassword } from "@/apis/services/auth";
import { LoginDto } from "@/apis/dto";
import { closeLoading, openLoading } from "@/redux/slices/loading-slice";
import { openAlert } from "@/redux/slices/alert-slice";
import { ACCESS_TOKEN } from "@/config/constants";
import { getSystemUsers, getUserInfo } from "@/apis/services/users";
import { getClasses } from "@/apis/services/classes";
import { Status, Role, Permission } from "@/config/enums";
import { getStudents } from "@/apis/services/students";
import { updateSystemInfo } from "@/redux/slices/system-slice";
import { getNotifications } from "@/apis/services/notifications";
import { useAuthClear } from "@/hooks/useAuthClear";

const validationSchema = Yup.object({
  email: Yup.string().email("Invalid email format").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

const forgotPasswordValidationSchema = Yup.object({
  email: Yup.string().email("Invalid email format").required("Email is required"),
});

const LoginPage = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  // Clear auth data when component mounts
  useAuthClear();

  // Function to determine redirect path based on role and permissions
  const getRedirectPath = (userRole: Role, userPermissions: Permission[]) => {
    // If user is ADMIN, redirect to calendar (default)
    if (userRole === Role.ADMIN) {
      return "/calendar";
    }

    // If user is TA, check permissions in order of priority
    if (userRole === Role.TA) {
      const priorityOrder = [
        { permission: Permission.CREATE_CLASS, path: "/calendar" },
        { permission: Permission.CREATE_STUDENT, path: "/students" },
        { permission: Permission.CREATE_ATTENDANCE, path: "/attendance" },
      ];

      for (const item of priorityOrder) {
        if (userPermissions.includes(item.permission)) {
          return item.path;
        }
      }
    }

    // Default fallback
    return "/calendar";
  };

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
          const responseClasses = await getClasses({
            fetchAll: true,
            status: Status.ACTIVE,
          });
          let activeClasses = responseClasses?.data || [];
          // get active students
          let responseStudents = await getStudents({
            fetchAll: true,
            status: Status.ACTIVE,
          });
          let studentList = responseStudents?.data || [];
          // get notifications
          const notifications = await getNotifications({
            userId: userInfo?.id,
          });
          // get system users
          const responseSystemUsers = await getSystemUsers({
            fetchAll: true,
            status: Status.ACTIVE,
          });
          let systemUsers = responseSystemUsers?.data || [];

          if (activeClasses?.length > 0) {
            const mappedActiveClasses = activeClasses?.map((cls: Class) => ({
              label: cls.name,
              value: cls.id.toString(),
            }));
            activeClasses = mappedActiveClasses;
          }
          if (studentList?.length > 0) {
            const mappedActiveStudents = studentList?.map((student: Student) => ({
              label: student.name,
              value: student.id.toString(),
            }));
            studentList = mappedActiveStudents;
          }
          if (systemUsers?.length > 0) {
            const mappedSystemUsers = systemUsers?.map((user: User) => ({
              label: user.fullname,
              value: user.id.toString(),
              role: user.role,
            }));
            systemUsers = mappedSystemUsers;
          }

          dispatch(
            updateSystemInfo({
              profile: userInfo,
              activeClasses: activeClasses || [],
              activeStudents: studentList || [],
              notifications: {
                data: notifications?.data || [],
                page: 1,
                total: notifications?.total || 0,
              },
              systemUsers: systemUsers || [],
            }),
          );

          // Determine redirect path based on role and permissions
          const redirectPath = getRedirectPath(userInfo?.role, userInfo?.permissions || []);
          router.push(redirectPath);

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
      title: "Forgot password",
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
                <button type="button" onClick={handleShowModal} className="text-primary-c900 text-sm hover:underline">
                  Forgot password?
                </button>
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
  const dispatch = useDispatch();

  const formik = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema: forgotPasswordValidationSchema,
    onSubmit: async (values) => {
      try {
        dispatch(openLoading());

        await forgotPassword({ email: values.email });

        dispatch(
          openAlert({
            isOpen: true,
            title: "SUCCESS",
            subtitle: "Password reset email has been sent to your email address.",
            type: "success",
          }),
        );
      } catch (error: any) {
        dispatch(
          openAlert({
            isOpen: true,
            title: "ERROR",
            subtitle: error?.message || "Failed to send password reset email. Please try again.",
            type: "error",
          }),
        );
      } finally {
        dispatch(closeLoading());
        dispatch(closeModal());
      }
    },
  });

  return (
    <div className="flex flex-col gap-4 py-4 px-3">
      <form onSubmit={formik.handleSubmit} className="w-full flex flex-col gap-4">
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
        <div className="flex justify-end">
          <Button type="submit" className="py-3 px-8" />
        </div>
      </form>
    </div>
  );
};
