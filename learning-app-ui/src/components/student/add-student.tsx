import Button from "@/lib/button";
import DatePicker from "@/lib/date-picker";
import Divider from "@/lib/divider";
import Select from "@/lib/select";
import TextField from "@/lib/textfield";
import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { ACTIVE_CLASSES } from "@/config/constants";
import { useDispatch } from "react-redux";
import { closeLoading, openLoading } from "@/redux/slices/loading-slice";
import { CreateStudentDto } from "@/apis/dto";
import { createStudent } from "@/apis/services/students";
import { openAlert } from "@/redux/slices/alert-slice";
import { refetch } from "@/redux/slices/refetch-slice";
import { closeDrawer } from "@/redux/slices/drawer-slice";

interface AddStudentFormValues {
  studentName: string;
  dateOfBirth: string;
  class: string;
  parentName: string;
  phoneNumber: string;
  secondaryPhoneNumber: string;
}

const validationSchema = Yup.object().shape({
  studentName: Yup.string().required("Student name is required").min(2, "Student name must be at least 2 characters"),
  dateOfBirth: Yup.string()
    .required("Date of birth is required")
    .test("is-valid-date", "Invalid date format", (value) => {
      if (!value) return false;
      const [day, month, year] = value.split("-");
      const date = new Date(`${year}-${month}-${day}`);
      return date instanceof Date && !isNaN(date.getTime());
    })
    .test("is-future-date", "Date of birth cannot be in the future", (value) => {
      if (!value) return false;
      const [day, month, year] = value.split("-");
      const date = new Date(`${year}-${month}-${day}`);
      return date <= new Date();
    }),
  class: Yup.string().required("Class is required"),
  parentName: Yup.string().required("Parent name is required").min(2, "Parent name must be at least 2 characters"),
  phoneNumber: Yup.string()
    .required("Phone number is required")
    .matches(/^[0-9]+$/, "Phone number must contain only digits")
    .min(10, "Phone number must be at least 10 digits")
    .max(11, "Phone number must not exceed 11 digits"),
  secondaryPhoneNumber: Yup.string()
    .matches(/^[0-9]+$/, "Secondary phone number must contain only digits")
    .min(10, "Secondary phone number must be at least 10 digits")
    .max(11, "Secondary phone number must not exceed 11 digits")
    .nullable(),
});

const initialValues: AddStudentFormValues = {
  studentName: "",
  dateOfBirth: "",
  class: "",
  parentName: "",
  phoneNumber: "",
  secondaryPhoneNumber: "",
};

const AddStudent = () => {
  const dispatch = useDispatch();
  const activeClasses = JSON.parse(localStorage.getItem(ACTIVE_CLASSES) || "[]");

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      try {
        dispatch(openLoading());
        const [day, month, year] = values.dateOfBirth.split("-");
        const dobDate = new Date(`${year}-${month}-${day}`);

        const studentData: CreateStudentDto = {
          classId: parseInt(values.class),
          name: values.studentName,
          dob: dobDate,
          parent: values.parentName,
          phoneNumber: values.phoneNumber,
          secondPhoneNumber: values.secondaryPhoneNumber || undefined,
        };
        await createStudent(studentData);
        dispatch(
          openAlert({
            isOpen: true,
            title: "SUCCESS",
            subtitle: "Student created successfully",
            type: "success",
          }),
        );
        dispatch(refetch());
      } catch (error: any) {
        dispatch(
          openAlert({
            isOpen: true,
            title: "ERROR",
            subtitle: error?.message || "Failed to create student",
            type: "error",
          }),
        );
      } finally {
        dispatch(closeLoading());
        dispatch(closeDrawer());
      }
    },
    validateOnChange: true,
    validateOnBlur: true,
  });

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-5">
      <TextField
        name="studentName"
        label="Name of student"
        inputClassName="font-questrial"
        value={formik.values.studentName}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={Boolean(formik.touched.studentName && formik.errors.studentName)}
        helperText={
          formik.touched.studentName && formik.errors.studentName ? String(formik.errors.studentName) : undefined
        }
      />

      <DatePicker
        onChange={(value: string) => {
          formik.setFieldValue("dateOfBirth", value);
        }}
        defaultDate={formik.values.dateOfBirth}
        label="Date of birth"
        error={Boolean(formik.touched.dateOfBirth && formik.errors.dateOfBirth)}
        helperText={
          formik.touched.dateOfBirth && formik.errors.dateOfBirth ? String(formik.errors.dateOfBirth) : undefined
        }
      />

      <Select
        label="Class"
        options={activeClasses}
        defaultValue={formik.values.class}
        onChange={(value) => formik.setFieldValue("class", value)}
        error={Boolean(formik.touched.class && formik.errors.class)}
        helperText={formik.touched.class && formik.errors.class ? String(formik.errors.class) : undefined}
      />

      <TextField
        name="parentName"
        label="Name of parent"
        inputClassName="font-questrial"
        value={formik.values.parentName}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={Boolean(formik.touched.parentName && formik.errors.parentName)}
        helperText={
          formik.touched.parentName && formik.errors.parentName ? String(formik.errors.parentName) : undefined
        }
      />

      <TextField
        name="phoneNumber"
        label="Phone number"
        value={formik.values.phoneNumber}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={Boolean(formik.touched.phoneNumber && formik.errors.phoneNumber)}
        helperText={
          formik.touched.phoneNumber && formik.errors.phoneNumber ? String(formik.errors.phoneNumber) : undefined
        }
      />

      <TextField
        name="secondaryPhoneNumber"
        label="Secondary phone number"
        value={formik.values.secondaryPhoneNumber}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={Boolean(formik.touched.secondaryPhoneNumber && formik.errors.secondaryPhoneNumber)}
        helperText={
          formik.touched.secondaryPhoneNumber && formik.errors.secondaryPhoneNumber
            ? String(formik.errors.secondaryPhoneNumber)
            : undefined
        }
      />

      <div className="mx-1 my-2">
        <Divider />
      </div>

      <Button
        type="submit"
        label="Save"
        className="w-full py-3.5 mt-2 mb-6"
        // disabled={!formik.isValid || formik.isSubmitting}
      />
    </form>
  );
};

export default AddStudent;
