"use client";
import Button from "@/lib/button";
import TextField from "@/lib/textfield";
import Select from "@/lib/select";
import Checkbox from "@/lib/checkbox";
import { closeDrawer } from "@/redux/slices/drawer-slice";
import { useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Permission, Role, Status } from "@/config/enums";
import { PermissionOptions } from "@/config/constants";
import { updateUser } from "@/apis/services/users";
import { UpdateUserDto } from "@/apis/dto";
import { openLoading, closeLoading } from "@/redux/slices/loading-slice";
import { openAlert } from "@/redux/slices/alert-slice";
import { refetch } from "@/redux/slices/refetch-slice";

interface EditUserProps {
  userData: {
    id: number;
    fullname: string;
    email: string;
    role: Role;
    locked: boolean;
    permissions?: Permission[];
  };
}

interface EditUserFormValues {
  fullName: string;
  email: string;
  role: Role;
  isActive: boolean;
  permissions?: Permission[];
}

const validationSchema = Yup.object().shape({
  fullName: Yup.string().required("Full name is required").min(2, "Full name must be at least 2 characters"),
  email: Yup.string().required("Email is required").email("Invalid email format"),
  role: Yup.string().required("Role is required").oneOf([Role.ADMIN, Role.TA], "Please select a valid role"),
  isActive: Yup.boolean().required("Status is required"),
  permissions: Yup.array()
    .of(Yup.string().oneOf(Object.values(Permission)))
    .when("role", {
      is: Role.TA,
      then: (schema) => schema.min(1, "Please select at least one permission"),
      otherwise: (schema) => schema.notRequired(),
    }),
});

const initialValues: EditUserFormValues = {
  fullName: "",
  email: "",
  role: Role.ADMIN,
  isActive: true,
  permissions: [],
};

const EditUser = ({ userData }: EditUserProps) => {
  const dispatch = useDispatch();
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      if (!userData?.id) {
        dispatch(
          openAlert({
            isOpen: true,
            title: "ERROR",
            subtitle: "Invalid user data",
            type: "error",
          }),
        );
        return;
      }

      try {
        dispatch(openLoading());
        const updateDto: UpdateUserDto = {
          id: userData.id,
          fullname: values.fullName,
          email: values.email,
          role: values.role,
          permissions: selectedPermissions,
          locked: !values.isActive,
        };

        await updateUser(updateDto);

        dispatch(
          openAlert({
            isOpen: true,
            title: "SUCCESS",
            subtitle: "User updated successfully!",
            type: "success",
          }),
        );
        dispatch(closeDrawer());
        dispatch(refetch());
      } catch (error: any) {
        dispatch(
          openAlert({
            isOpen: true,
            title: "ERROR",
            subtitle: error?.message || "Failed to update user",
            type: "error",
          }),
        );
      } finally {
        dispatch(closeLoading());
      }
    },
  });

  useEffect(() => {
    if (userData) {
      const initialPermissions = userData.permissions || [];
      setSelectedPermissions(initialPermissions);
      formik.setValues({
        fullName: userData.fullname,
        email: userData.email,
        role: userData.role,
        isActive: !userData.locked,
        permissions: initialPermissions,
      });
    }
  }, [userData]);

  const handleRoleChange = (value: string) => {
    formik.setFieldValue("role", value);
    if (value !== Role.TA) {
      setSelectedPermissions([]);
      formik.setFieldValue("permissions", []);
    } else {
      // Trigger validation when switching to TA role
      formik.validateField("permissions");
    }
  };

  const handlePermissionChange = (value: Permission, checked: boolean) => {
    let newPermissions: Permission[];
    if (checked) {
      newPermissions = [...selectedPermissions, value];
    } else {
      newPermissions = selectedPermissions.filter((p) => p !== value);
    }

    setSelectedPermissions(newPermissions);
    formik.setFieldValue("permissions", newPermissions);
  };

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
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
          { label: "Admin", value: Role.ADMIN },
          { label: "Teacher Assistant", value: Role.TA },
        ]}
        defaultValue={formik.values.role}
        onChange={handleRoleChange}
        error={Boolean(formik.touched.role && formik.errors.role)}
        helperText={formik.touched.role && formik.errors.role ? String(formik.errors.role) : undefined}
      />
      {formik.values.role === Role.TA && (
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
                    onClick={() =>
                      handlePermissionChange(
                        option.value as Permission,
                        !selectedPermissions.includes(option.value as Permission),
                      )
                    }
                  >
                    <Checkbox
                      isChecked={selectedPermissions.includes(option.value as Permission)}
                      onChange={(checked: boolean) => handlePermissionChange(option.value as Permission, checked)}
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
      <Select
        label="Status"
        options={[
          { label: "Active", value: Status.ACTIVE },
          { label: "Inactive", value: Status.INACTIVE },
        ]}
        defaultValue={formik.values.isActive ? Status.ACTIVE : Status.INACTIVE}
        onChange={(value) => formik.setFieldValue("isActive", value === Status.ACTIVE)}
        error={Boolean(formik.touched.isActive && formik.errors.isActive)}
        helperText={formik.touched.isActive && formik.errors.isActive ? String(formik.errors.isActive) : undefined}
      />
      <Button type="submit" label="Save" className={`w-full py-3.5 mb-6`} />
    </form>
  );
};

export default EditUser;
