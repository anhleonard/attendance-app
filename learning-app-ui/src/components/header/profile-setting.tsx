import Button from "@/lib/button";
import TextField from "@/lib/textfield";
import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { openLoading, closeLoading } from "@/redux/slices/loading-slice";
import { openAlert } from "@/redux/slices/alert-slice";
import { updateUser } from "@/apis/services/users";
import { RootState } from "@/redux/store";
import { updateSystemInfo } from "@/redux/slices/system-slice";
import { closeModal } from "@/redux/slices/modal-slice";

interface ProfileFormValues {
  fullname: string;
  email: string;
}

const validationSchema = Yup.object({
  fullname: Yup.string()
    .required("Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must not exceed 50 characters"),
});

const ProfileSetting = () => {
  const dispatch = useDispatch();
  const [avatar, setAvatar] = useState<string | File>("");
  const { profile } = useSelector((state: RootState) => state.system);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setAvatar(profile?.avatar || "");
        formik.setValues({
          fullname: profile?.fullname || "",
          email: profile?.email || "",
        });
      } catch (error: any) {
        dispatch(
          openAlert({
            isOpen: true,
            title: "ERROR",
            subtitle: error?.message || "Failed to fetch user info",
            type: "error",
          }),
        );
      }
    };

    fetchUserInfo();
  }, []);

  const formik = useFormik<ProfileFormValues>({
    initialValues: {
      fullname: "",
      email: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!profile?.id) {
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

        // Only send avatar if it's a File object (new file selected)
        const avatarToUpdate = avatar instanceof File ? avatar : undefined;

        // Update user info
        await updateUser(
          {
            id: profile.id,
            fullname: values.fullname,
          },
          avatarToUpdate,
        );

        // Update local storage
        const updatedUserInfo = {
          ...profile,
          fullname: values.fullname,
          avatar: avatar instanceof File ? URL.createObjectURL(avatar) : avatar,
        };

        // Update system info in redux
        dispatch(updateSystemInfo({ profile: updatedUserInfo }));

        // Reset avatar state to string URL after successful update
        setAvatar(updatedUserInfo.avatar);

        dispatch(
          openAlert({
            isOpen: true,
            title: "SUCCESS",
            subtitle: "Profile updated successfully!",
            type: "success",
          }),
        );
      } catch (error: any) {
        dispatch(
          openAlert({
            isOpen: true,
            title: "ERROR",
            subtitle: error?.message || "Failed to update profile",
            type: "error",
          }),
        );
      } finally {
        dispatch(closeLoading());
        dispatch(closeModal());
      }
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        dispatch(
          openAlert({
            isOpen: true,
            title: "ERROR",
            subtitle: "File size should not exceed 5MB",
            type: "error",
          }),
        );
        e.target.value = "";
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        dispatch(
          openAlert({
            isOpen: true,
            title: "ERROR",
            subtitle: "Please select an image file",
            type: "error",
          }),
        );
        e.target.value = "";
        return;
      }

      setAvatar(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = document.getElementById("preview-avatar") as HTMLImageElement;
        const letterElement = document.getElementById("avatar-letter");
        if (preview && letterElement && e.target?.result) {
          preview.src = e.target.result as string;
          preview.classList.remove("hidden");
          letterElement.classList.add("hidden");
        }
      };
      reader.onerror = () => {
        dispatch(
          openAlert({
            isOpen: true,
            title: "ERROR",
            subtitle: "Error reading file",
            type: "error",
          }),
        );
        e.target.value = "";
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={formik.handleSubmit} className="text-grey-c900 flex flex-col gap-5 px-2 py-3">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center bg-white text-primary-c700 border-[1.5px] border-primary-c200 text-xl lg:text-2xl font-semibold"
            id="preview-avatar-container"
          >
            <img
              src={typeof avatar === "string" ? avatar || "/default-avatar.png" : URL.createObjectURL(avatar)}
              alt="Profile"
              className={`w-full h-full rounded-full object-cover border-[1.5px] border-primary-c200 ${
                avatar ? "" : "hidden"
              }`}
              id="preview-avatar"
            />
            <span id="avatar-letter" className={avatar ? "hidden" : ""}>
              {profile?.fullname?.substring(0, 2).toUpperCase() || "AN"}
            </span>
          </div>
          <label
            htmlFor="avatar-input"
            className="absolute bottom-0 right-0 bg-primary-c700 p-1.5 rounded-full cursor-pointer hover:bg-primary-c800 active:bg-primary-c900 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="white"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
              />
            </svg>
          </label>
          <input type="file" id="avatar-input" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
      </div>
      <TextField
        label="Name"
        name="fullname"
        value={formik.values.fullname}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={Boolean(formik.touched.fullname && formik.errors.fullname)}
        helperText={formik.touched.fullname && formik.errors.fullname ? String(formik.errors.fullname) : undefined}
        inputClassName="font-questrial"
      />
      <TextField label="Email" name="email" value={formik.values.email} disabled />
      <div className="flex justify-end">
        <Button type="submit" label="Save" className="py-2.5 px-6" disabled={!formik.dirty && !avatar} />
      </div>
    </form>
  );
};

export default ProfileSetting;
