"use client";
import Button from "@/lib/button";
import TextField from "@/lib/textfield";
import Select from "@/lib/select";
import { closeDrawer } from "@/redux/slices/drawer-slice";
import { useDispatch } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";

interface AddUserFormValues {
  username: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}

const validationSchema = Yup.object().shape({
  username: Yup.string().required("Username is required").min(3, "Username must be at least 3 characters"),
  fullName: Yup.string().required("Full name is required").min(2, "Full name must be at least 2 characters"),
  email: Yup.string().required("Email is required").email("Invalid email format"),
  password: Yup.string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: Yup.string()
    .required("Please confirm your password")
    .oneOf([Yup.ref("password")], "Passwords must match"),
  role: Yup.string().required("Role is required").oneOf(["ADMIN", "TA"], "Please select a valid role"),
});

const initialValues: AddUserFormValues = {
  username: "",
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "",
};

const AddUser = () => {
  const dispatch = useDispatch();

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: (values) => {
      // TODO: Implement add user logic
      console.log(values);
      dispatch(closeDrawer());
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
      <TextField
        name="username"
        label="Username"
        value={formik.values.username}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={Boolean(formik.touched.username && formik.errors.username)}
        helperText={formik.touched.username && formik.errors.username ? String(formik.errors.username) : undefined}
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
      <TextField
        name="password"
        label="Password"
        inputType="password"
        value={formik.values.password}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={Boolean(formik.touched.password && formik.errors.password)}
        helperText={formik.touched.password && formik.errors.password ? String(formik.errors.password) : undefined}
      />
      <TextField
        name="confirmPassword"
        label="Confirm password"
        inputType="password"
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
      <Select
        label="Role"
        options={[
          { label: "Admin", value: "ADMIN" },
          { label: "Teacher Assistant", value: "TA" },
        ]}
        defaultValue={formik.values.role}
        onChange={(value) => formik.setFieldValue("role", value)}
        error={Boolean(formik.touched.role && formik.errors.role)}
        helperText={formik.touched.role && formik.errors.role ? String(formik.errors.role) : undefined}
      />
      <Button type="submit" label="Save" className={`w-full py-3.5 mb-6`} />
    </form>
  );
};

export default AddUser;
