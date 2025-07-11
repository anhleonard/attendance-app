import { Student, OptionState } from "@/config/types";
import Button from "@/lib/button";
import DatePicker from "@/lib/date-picker";
import Divider from "@/lib/divider";
import Select from "@/lib/select";
import TextField from "@/lib/textfield";
import { closeLoading, openLoading } from "@/redux/slices/loading-slice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import { UpdateStudentDto } from "@/apis/dto";
import { updateStudent } from "@/apis/services/students";
import { openAlert } from "@/redux/slices/alert-slice";
import { refetch } from "@/redux/slices/refetch-slice";
import { closeDrawer } from "@/redux/slices/drawer-slice";
import moment from "moment";
import { Status, Role } from "@/config/enums";
import { RootState } from "@/redux/store";
import { maskPhoneNumber } from "@/config/functions";

interface Props {
  student: Student;
  disabled?: boolean;
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
  status: Yup.string().required("Status is required"),
  class: Yup.string().when('status', {
    is: Status.ACTIVE,
    then: (schema) => schema.required("Class is required"),
    otherwise: (schema) => schema.optional(),
  }),
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

const EditStudent = ({ student }: Props) => {
  const dispatch = useDispatch();
  const activeClasses: OptionState[] = useSelector((state: RootState) => state.system.activeClasses) || [];
  const { profile } = useSelector((state: RootState) => state.system);

  const formik = useFormik({
    initialValues: {
      studentName: student.name,
      dateOfBirth: moment(student.dob).format("DD-MM-YYYY"),
      status: student.status,
      class: student.classes?.find((c) => c.status === Status.ACTIVE)?.class?.id.toString() || "",
      parentName: student.parent,
      phoneNumber: student.phoneNumber,
      secondaryPhoneNumber: student.secondPhoneNumber || "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        dispatch(openLoading());
        const [day, month, year] = values.dateOfBirth.split("-");
        const dobDate = new Date(`${year}-${month}-${day}`);

        const studentData: UpdateStudentDto = {
          id: student.id,
          status: values.status,
          classId: values.status === Status.ACTIVE ? parseInt(values.class) : undefined,
          name: values.studentName,
          dob: dobDate,
          parent: values.parentName,
          phoneNumber: values.phoneNumber,
          secondPhoneNumber: values.secondaryPhoneNumber,
        };

        await updateStudent(studentData);
        dispatch(
          openAlert({
            isOpen: true,
            title: "SUCCESS",
            subtitle: "Student updated successfully",
            type: "success",
          }),
        );
        dispatch(refetch());
      } finally {
        dispatch(closeLoading());
        dispatch(closeDrawer());
        dispatch(refetch());
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
        label="Status"
        options={[
          { label: "Active", value: Status.ACTIVE },
          { label: "Inactive", value: Status.INACTIVE },
        ]}
        defaultValue={formik.values.status}
        onChange={(value) => formik.setFieldValue("status", value)}
        error={Boolean(formik.touched.status && formik.errors.status)}
        helperText={formik.touched.status && formik.errors.status ? String(formik.errors.status) : undefined}
      />

      {formik.values.status === Status.ACTIVE && (
        <Select
          label="Class"
          options={activeClasses}
          defaultValue={formik.values.class}
          onChange={(value) => formik.setFieldValue("class", value)}
          error={Boolean(formik.touched.class && formik.errors.class)}
          helperText={formik.touched.class && formik.errors.class ? String(formik.errors.class) : undefined}
        />
      )}

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
        value={profile?.role === Role.TA ? maskPhoneNumber(formik.values.phoneNumber) : formik.values.phoneNumber}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={Boolean(formik.touched.phoneNumber && formik.errors.phoneNumber)}
        helperText={
          formik.touched.phoneNumber && formik.errors.phoneNumber ? String(formik.errors.phoneNumber) : undefined
        }
        disabled={profile?.role === Role.TA}
      />

      <TextField
        name="secondaryPhoneNumber"
        label="Secondary phone number"
        value={profile?.role === Role.TA ? maskPhoneNumber(formik.values.secondaryPhoneNumber) : formik.values.secondaryPhoneNumber}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={Boolean(formik.touched.secondaryPhoneNumber && formik.errors.secondaryPhoneNumber)}
        helperText={
          formik.touched.secondaryPhoneNumber && formik.errors.secondaryPhoneNumber
            ? String(formik.errors.secondaryPhoneNumber)
            : undefined
        }
        disabled={profile?.role === Role.TA}
      />

      <div className="mx-1 my-2">
        <Divider />
      </div>

      <Button type="submit" label="Save" className="w-full py-3.5 mt-2 mb-6" disabled={!formik.dirty} />
    </form>
  );
};

export default EditStudent;
