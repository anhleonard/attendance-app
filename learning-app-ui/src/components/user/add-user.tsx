"use client";
import Button from "@/lib/button";
import TextField from "@/lib/textfield";
import Select from "@/lib/select";
import Checkbox from "@/lib/checkbox";
import { closeDrawer } from "@/redux/slices/drawer-slice";
import { useDispatch } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import Image from "next/image";
import { useState } from "react";
import { Permission, Role } from "@/config/enums";
import { PermissionOptions } from "@/config/constants";
import { register } from "@/apis/services/auth";
import { openLoading, closeLoading } from "@/redux/slices/loading-slice";
import { openAlert } from "@/redux/slices/alert-slice";
import { refetch } from "@/redux/slices/refetch-slice";

interface WarningProps {
  title: string;
  subtitle: string;
  className?: string;
}

const Warning: React.FC<WarningProps> = ({ title, subtitle, className = "" }) => {
  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg bg-[#FFE8C7]/50 ${className}`}>
      <div className="flex-shrink-0">
        <Image src="/icons/warning-icon.svg" alt="warning-icon" width={24} height={24} />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-sm text-[#FE9800]">{title}</h3>
        <p className="text-xs mt-1 text-[#FE9800]">{subtitle}</p>
      </div>
    </div>
  );
};

interface AddUserFormValues {
  fullName: string;
  email: string;
  role: string;
  permissions?: Permission[];
}

const validationSchema = Yup.object().shape({
  fullName: Yup.string().required("Full name is required").min(2, "Full name must be at least 2 characters"),
  email: Yup.string().required("Email is required").email("Invalid email format"),
  role: Yup.string().required("Role is required").oneOf(["ADMIN", "TA"], "Please select a valid role"),
  permissions: Yup.array()
    .of(Yup.string().oneOf(Object.values(Permission)))
    .when("role", {
      is: "TA",
      then: (schema) => schema.min(1, "Please select at least one permission"),
      otherwise: (schema) => schema.notRequired(),
    }),
});

const initialValues: AddUserFormValues = {
  fullName: "",
  email: "",
  role: "",
  permissions: [],
};

const AddUser = () => {
  const dispatch = useDispatch();
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      try {
        dispatch(openLoading());
        await register({
          fullname: values.fullName,
          email: values.email,
          role: values.role as Role,
          permissions: values.permissions,
          type: "system-user",
        });
        dispatch(refetch());
        dispatch(closeDrawer());
        dispatch(
          openAlert({
            isOpen: true,
            title: "SUCCESS",
            subtitle: "User has been created successfully!",
            type: "success",
          }),
        );
      } finally {
        dispatch(closeLoading());
      }
    },
  });

  const handleRoleChange = (value: string) => {
    formik.setFieldValue("role", value);
    if (value !== "TA") {
      formik.setFieldValue("permissions", []);
      setSelectedPermissions([]);
    } else {
      formik.validateField("permissions");
    }
  };

  const handlePermissionChange = (value: string, checked: boolean) => {
    const newPermissions = checked ? [...selectedPermissions, value] : selectedPermissions.filter((p) => p !== value);

    setSelectedPermissions(newPermissions);
    formik.setFieldValue("permissions", newPermissions, true);
  };

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
      <Warning
        title="Important"
        subtitle="Please enter a valid email address. The system will send the login credentials to this email."
      />
      <TextField
        name="fullName"
        label="Full name"
        inputClassName="font-questrial"
        value={formik.values.fullName}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={Boolean(formik.touched.fullName && formik.errors.fullName)}
        helperText={formik.touched.fullName && formik.errors.fullName ? String(formik.errors.fullName) : undefined}
      />
      <TextField
        name="email"
        label="Email"
        inputType="email"
        value={formik.values.email}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={Boolean(formik.touched.email && formik.errors.email)}
        helperText={formik.touched.email && formik.errors.email ? String(formik.errors.email) : undefined}
      />
      <Select
        label="Role"
        options={[
          { label: "Admin", value: "ADMIN" },
          { label: "Teacher Assistant", value: "TA" },
        ]}
        defaultValue={formik.values.role}
        onChange={handleRoleChange}
        error={Boolean(formik.touched.role && formik.errors.role)}
        helperText={formik.touched.role && formik.errors.role ? String(formik.errors.role) : undefined}
      />
      {formik.values.role === "TA" && (
        <div className="flex flex-col gap-1">
          <div className="flex flex-col gap-3 px-4 pt-3 pb-5 border-2 border-grey-c200 rounded-[20px]">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-grey-c200">
                Permissions <span className="text-support-c300">*</span>
              </label>
            </div>
            <div className="flex flex-col gap-4">
              {PermissionOptions.map((option) => (
                <div key={option.value} className="flex items-center gap-2">
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => handlePermissionChange(option.value, !selectedPermissions.includes(option.value))}
                  >
                    <Checkbox
                      isChecked={selectedPermissions.includes(option.value)}
                      onChange={(checked: boolean) => handlePermissionChange(option.value, checked)}
                    />
                    <label className="text-sm text-grey-c900 cursor-pointer">{option.label}</label>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {formik.touched.permissions && formik.errors.permissions && (
            <div className="text-xs text-support-c300">{String(formik.errors.permissions)}</div>
          )}
        </div>
      )}
      <Button type="submit" label="Save" className={`w-full py-3.5 mb-6`} />
    </form>
  );
};

export default AddUser;
