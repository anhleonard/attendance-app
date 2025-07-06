import { AmountSessions, Days, Times } from "@/config/constants";
import Button from "@/lib/button";
import Divider from "@/lib/divider";
import Label from "@/lib/label";
import Select from "@/lib/select";
import TextArea from "@/lib/textarea";
import TextField from "@/lib/textfield";
import Image from "next/image";
import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { createClass } from "@/apis/services/classes";
import { CreateClassDto, CreateSessionDto } from "@/apis/dto";
import { useRouter } from "next/navigation";
import { openAlert } from "@/redux/slices/alert-slice";
import { useDispatch, useSelector } from "react-redux";
import { openLoading, closeLoading } from "@/redux/slices/loading-slice";
import { closeDrawer } from "@/redux/slices/drawer-slice";
import { getSessionKeyByDay } from "@/config/functions";
import { refetch } from "@/redux/slices/refetch-slice";
import { RootState } from "@/redux/store";
import { updateSystemInfo } from "@/redux/slices/system-slice";

interface AddClassFormValues {
  className: string;
  sessionsPerWeek: string;
  aboutClass: string;
  sessions: {
    day: string;
    startTime: string;
    endTime: string;
    money: string;
  }[];
}

const validationSchema = Yup.object().shape({
  className: Yup.string().required("Class name is required"),
  sessionsPerWeek: Yup.string().required("Sessions per week is required"),
  aboutClass: Yup.string().required("About class is required"),
  sessions: Yup.array().of(
    Yup.object().shape({
      day: Yup.string().required("Day is required"),
      startTime: Yup.string().required("Start time is required"),
      endTime: Yup.string()
        .required("End time is required")
        .test("is-after-start", "End time must be after start time", function (value) {
          const { startTime } = this.parent;
          if (!startTime || !value) return true;
          return value > startTime;
        }),
      money: Yup.string().required("Money is required"),
    }),
  ).test("no-duplicate-days", "Cannot have multiple sessions on the same day", function (sessions) {
    if (!sessions) return true;
    
    const days = sessions.map(session => session.day).filter(day => day !== "");
    const uniqueDays = new Set(days);
    
    if (days.length !== uniqueDays.size) {
      return this.createError({
        message: "Cannot have multiple sessions on the same day"
      });
    }
    
    return true;
  }),
});

const initialSessionValue = {
  day: "",
  startTime: "",
  endTime: "",
  money: "",
};

const initialValues: AddClassFormValues = {
  className: "",
  sessionsPerWeek: "",
  aboutClass: "",
  sessions: [initialSessionValue],
};

const AddClass = () => {
  const dispatch = useDispatch();
  const activeClasses = useSelector((state: RootState) => state.system.activeClasses);

  const formik = useFormik({
    initialValues: initialValues,
    validationSchema,
    onSubmit: async (values) => {
      try {
        dispatch(openLoading());
        const sessions: CreateSessionDto[] = values.sessions.map((session) => ({
          sessionKey: getSessionKeyByDay(session.day),
          startTime: session.startTime,
          endTime: session.endTime,
          amount: parseInt(session.money.replace(/,/g, "")),
        }));

        const classData: CreateClassDto = {
          name: values.className,
          description: values.aboutClass,
          sessions,
        };

        const newClass = await createClass(classData);

        // Add new class to Redux store
        const newClassOption = {
          label: values.className,
          value: newClass.id.toString(),
        };

        const updatedActiveClasses = [...(activeClasses || []), newClassOption];

        dispatch(
          updateSystemInfo({
            activeClasses: updatedActiveClasses,
          }),
        );

        dispatch(
          openAlert({
            isOpen: true,
            title: "SUCCESS",
            subtitle: "Class created successfully!",
            type: "success",
          }),
        );
        dispatch(refetch());
      } catch (error: any) {
        dispatch(
          openAlert({
            isOpen: true,
            title: "ERROR",
            subtitle: error?.message || "Failed to create class",
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

  const renderSessionForm = (index: number) => {
    const sessionErrors = formik.errors.sessions?.[index] as
      | { day?: string; startTime?: string; endTime?: string; money?: string }
      | undefined;
    const sessionTouched = formik.touched.sessions?.[index] as
      | { day?: boolean; startTime?: boolean; endTime?: boolean; money?: boolean }
      | undefined;

    return (
      <div className="flex flex-col gap-4">
        <Label label={`Session ${index + 1}`} className="w-fit font-semibold text-primary-c900" />
        <div className="flex flex-col gap-4">
          <Select
            label="Select day"
            options={Days}
            position="top"
            defaultValue={formik.values.sessions[index].day}
            onChange={(value) => {
              formik.setFieldValue(`sessions.${index}.day`, value);
              formik.setFieldTouched(`sessions.${index}.day`, true);
              formik.validateField('sessions');
            }}
            error={Boolean(sessionTouched?.day && sessionErrors?.day)}
            helperText={sessionTouched?.day && sessionErrors?.day ? sessionErrors.day : undefined}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Start time"
              options={Times}
              position="top"
              endIcon={<Image src="/icons/clock-icon.svg" alt="clock-icon" width={20} height={20} />}
              isRotateIcon={false}
              defaultValue={formik.values.sessions[index].startTime}
              onChange={(value) => formik.setFieldValue(`sessions.${index}.startTime`, value)}
              error={Boolean(sessionTouched?.startTime && sessionErrors?.startTime)}
              helperText={sessionTouched?.startTime && sessionErrors?.startTime ? sessionErrors.startTime : undefined}
            />
            <Select
              label="End time"
              options={Times}
              position="top"
              endIcon={<Image src="/icons/clock-icon.svg" alt="clock-icon" width={20} height={20} />}
              isRotateIcon={false}
              defaultValue={formik.values.sessions[index].endTime}
              onChange={(value) => formik.setFieldValue(`sessions.${index}.endTime`, value)}
              error={Boolean(sessionTouched?.endTime && sessionErrors?.endTime)}
              helperText={sessionTouched?.endTime && sessionErrors?.endTime ? sessionErrors.endTime : undefined}
            />
          </div>

          <TextField
            name={`sessions.${index}.money`}
            label="Money of this session"
            inputType="amount"
            value={formik.values.sessions[index].money}
            onChange={(e) => {
              if (typeof e === "string") {
                formik.setFieldValue(`sessions.${index}.money`, e);
              } else {
                let newValue = e.target.value;
                let numericValue = newValue.replace(/\D/g, "");
                numericValue = numericValue.replace(/^0+/, "");
                if (numericValue === "") {
                  newValue = "";
                } else {
                  newValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                }
                formik.setFieldValue(`sessions.${index}.money`, newValue);
              }
            }}
            onBlur={formik.handleBlur}
            error={Boolean(sessionTouched?.money && sessionErrors?.money)}
            helperText={sessionTouched?.money && sessionErrors?.money ? sessionErrors.money : undefined}
          />
        </div>
      </div>
    );
  };

  const handleSessionsPerWeekChange = (value: string) => {
    const numSessions = parseInt(value);
    const currentSessions = formik.values.sessions;

    // Update sessions array based on the new number of sessions
    if (numSessions > currentSessions.length) {
      // Add new sessions
      const newSessions = [...currentSessions];
      while (newSessions.length < numSessions) {
        newSessions.push({ ...initialSessionValue });
      }
      formik.setFieldValue("sessions", newSessions);
    } else if (numSessions < currentSessions.length) {
      // Remove excess sessions
      formik.setFieldValue("sessions", currentSessions.slice(0, numSessions));
    }

    formik.setFieldValue("sessionsPerWeek", value);
    formik.setFieldTouched("sessionsPerWeek", true);
    
    // Trigger validation for sessions after changing the number
    setTimeout(() => {
      formik.validateField('sessions');
    }, 0);
  };

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
      <TextField
        name="className"
        label="Name of class"
        inputClassName="font-questrial"
        value={formik.values.className}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={Boolean(formik.touched.className && formik.errors.className)}
        helperText={formik.touched.className && formik.errors.className ? String(formik.errors.className) : undefined}
      />

      <Select
        label="Sessions per week"
        options={AmountSessions}
        defaultValue={formik.values.sessionsPerWeek}
        onChange={handleSessionsPerWeekChange}
        error={Boolean(formik.touched.sessionsPerWeek && formik.errors.sessionsPerWeek)}
        helperText={
          formik.touched.sessionsPerWeek && formik.errors.sessionsPerWeek
            ? String(formik.errors.sessionsPerWeek)
            : undefined
        }
      />

      <TextArea
        label="About class"
        value={formik.values.aboutClass}
        onChange={(value) => formik.setFieldValue("aboutClass", value)}
        onBlur={() => formik.setFieldTouched("aboutClass", true)}
        error={Boolean(formik.touched.aboutClass && formik.errors.aboutClass)}
        helperText={
          formik.touched.aboutClass && formik.errors.aboutClass ? String(formik.errors.aboutClass) : undefined
        }
      />

      <div className="mx-1 my-2">
        <Divider />
      </div>

      <div className="flex flex-col gap-8">
        {formik.values.sessionsPerWeek &&
          formik.values.sessions.map((_, index) => (
            <React.Fragment key={`session-${index}`}>{renderSessionForm(index)}</React.Fragment>
          ))}
      </div>

      {formik.touched.sessions && formik.errors.sessions && typeof formik.errors.sessions === 'string' && (
        <div className="text-red-500 text-sm mt-2">
          {formik.errors.sessions}
        </div>
      )}

      {formik.values.sessionsPerWeek && (
        <div className="mx-1 my-2">
          <Divider />
        </div>
      )}

      <Button
        type="submit"
        label="Save"
        className={`w-full py-3.5 mb-6 ${formik.values.sessionsPerWeek ? "mt-2" : "mt-[-8]"}`}
      />
    </form>
  );
};

export default AddClass;
