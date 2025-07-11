import { Role } from "@/config/enums";
import { OptionState, User } from "@/config/types";
import Button from "@/lib/button";
import Label from "@/lib/label";
import Select from "@/lib/select";
import TextArea from "@/lib/textarea";
import TextField from "@/lib/textfield";
import { RootState } from "@/redux/store";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { closeLoading, openLoading } from "@/redux/slices/loading-slice";
import { createNotification } from "@/apis/services/notifications";
import { openAlert } from "@/redux/slices/alert-slice";
import { closeModal } from "@/redux/slices/modal-slice";

const getAvailableSystemUsers = (systemUsers: OptionState[], profile: User | null) => {
  if (!profile) return [];
  if (profile?.role === Role.ADMIN) {
    return systemUsers
      .map((user) => ({
        ...user,
        label: (
          <div className="flex items-center justify-between">
            <span>{user.label}</span>
            <Label
              label={user?.role || ""}
              status={user?.role === Role.ADMIN ? "success" : "warning"}
              className="text-xs font-medium py-1 px-3 w-20"
            />
          </div>
        ),
      }))
      .filter((user) => user.value !== profile?.id.toString());
  }
  return systemUsers
    .map((user) => ({
      ...user,
      label: (
        <div className="flex items-center justify-between">
          <span>{user.label}</span>
          <Label
            label={user.role || ""}
            status={user.role === Role.ADMIN ? "success" : "warning"}
            className="text-xs font-medium py-1 px-3 w-20"
          />
        </div>
      ),
    }))
    .filter((user) => user.value !== profile?.id.toString() && user.role === Role.ADMIN);
};

interface RequestFormValues {
  title: string;
  message: string;
  receiverId: string;
}

const validationSchema = Yup.object().shape({
  title: Yup.string().required("Title is required"),
  message: Yup.string().required("Message is required"),
  receiverId: Yup.string().required("Please select a receiver"),
});

const MakeRequestModal = () => {
  const dispatch = useDispatch();
  const { profile, systemUsers } = useSelector((state: RootState) => state.system);

  const initialValues: RequestFormValues = {
    title: "",
    message: "",
    receiverId: "",
  };

  const handleSubmit = async (values: RequestFormValues) => {
    try {
      dispatch(openLoading());
      await createNotification({
        title: values.title,
        message: values.message,
        receiverIds: [Number(values.receiverId)],
      });
      dispatch(
        openAlert({
          isOpen: true,
          title: "SUCCESS",
          subtitle: "Notification created successfully",
          type: "success",
        }),
      );
    } finally {
      dispatch(closeLoading());
      dispatch(closeModal());
    }
  };

  return (
    <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
      {({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => (
        <Form className="text-grey-c900 flex flex-col gap-5 px-2 py-3">
          <TextField
            label="Title"
            name="title"
            value={values.title}
            onChange={(e) => handleChange("title")(e)}
            onBlur={() => handleBlur("title")}
            error={!!(touched.title && errors.title)}
            helperText={touched.title && errors.title ? String(errors.title) : undefined}
          />
          <TextArea
            label="Message"
            value={values.message}
            onChange={(value) => setFieldValue("message", value)}
            onBlur={() => handleBlur("message")}
            error={!!(touched.message && errors.message)}
            helperText={touched.message && errors.message ? String(errors.message) : undefined}
          />
          <Select
            label={`${profile?.role === "ADMIN" ? "Assign to" : "Request to"}`}
            defaultValue={values.receiverId}
            onChange={(value) => setFieldValue("receiverId", value)}
            error={!!(touched.receiverId && errors.receiverId)}
            helperText={touched.receiverId && errors.receiverId ? String(errors.receiverId) : undefined}
            options={getAvailableSystemUsers(systemUsers || [], profile || null)}
          />
          <div className="flex justify-end">
            <Button type="submit" label="Send" className="py-3 px-8" />
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default MakeRequestModal;
