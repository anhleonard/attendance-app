import React, { useState } from "react";
import Button from "@/lib/button";
import Select from "@/lib/select";
import { useDropzone } from "react-dropzone";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import Image from "next/image";
import { useFormik } from "formik";
import * as Yup from "yup";
import { ImportFileStudentDto } from "@/apis/dto";
import { importFileStudent } from "@/apis/services/students";
import { openAlert } from "@/redux/slices/alert-slice";
import { closeLoading, openLoading } from "@/redux/slices/loading-slice";
import { refetch } from "@/redux/slices/refetch-slice";
import { closeModal } from "@/redux/slices/modal-slice";
import { OptionState } from "@/config/types";

interface ImportFileFormValues {
  selectedClass: string;
  selectedFile: File | null;
}

const validationSchema = Yup.object().shape({
  selectedClass: Yup.string().required("Class selection is required"),
  selectedFile: Yup.mixed().required("File is required"),
});

const ImportFileModal = () => {
  const dispatch = useDispatch();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const activeClasses: OptionState[] = useSelector((state: RootState) => state.system.activeClasses) || [];

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      setSelectedFile(acceptedFiles[0]);
    },
  });

  const formik = useFormik<ImportFileFormValues>({
    initialValues: {
      selectedClass: "",
      selectedFile: null,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        dispatch(openLoading());
        const data: ImportFileStudentDto = {
          classId: Number(values.selectedClass),
          file: values.selectedFile as File,
        };
        await importFileStudent(data);
        dispatch(
          openAlert({
            isOpen: true,
            title: "SUCCESS",
            subtitle: "Import students successfully",
            type: "success",
          }),
        );
        dispatch(refetch());
      } finally {
        dispatch(closeLoading());
        dispatch(closeModal());
      }
    },
    validateOnChange: true,
    validateOnBlur: true,
  });

  const handleDownloadTemplate = () => {
    try {
      // Create a link element
      const link = document.createElement("a");
      // Set the file path - this will be in public/templates/student-import-template.xlsx
      link.href = "/templates/import-student-template.xlsx";
      // Set the download attribute with a suggested filename
      link.download = "import-student-template.xlsx";
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      dispatch(
        openAlert({
          isOpen: true,
          title: "ERROR",
          subtitle: "Failed to download template",
          type: "error",
        }),
      );
    }
  };

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col w-full gap-4 p-4">
      <Select
        label="Select class"
        options={activeClasses}
        defaultValue={formik.values.selectedClass}
        onChange={(value) => formik.setFieldValue("selectedClass", value)}
        error={Boolean(formik.touched.selectedClass && formik.errors.selectedClass)}
        helperText={
          formik.touched.selectedClass && formik.errors.selectedClass ? String(formik.errors.selectedClass) : undefined
        }
      />

      <div className="flex flex-col gap-1">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer flex flex-col items-center justify-center gap-2
            ${
              isDragActive
                ? "border-primary-c500 bg-primary-c50"
                : formik.touched.selectedFile && formik.errors.selectedFile
                ? "border-support-c100 bg-support-c10"
                : "border-gray-300 hover:border-primary-c400 hover:bg-gray-50"
            } transition-all duration-300`}
        >
          <input
            {...getInputProps()}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setSelectedFile(file);
                formik.setFieldValue("selectedFile", file);
              }
            }}
          />
          <div className="flex flex-col items-center text-gray-600">
            <Image src="/icons/import-file-icon.svg" alt="import-file-icon" width={32} height={32} />

            {selectedFile ? (
              <div className="text-sm font-medium text-gray-700">
                Selected file: <span className="text-primary-c900">{selectedFile.name}</span>
              </div>
            ) : (
              <>
                <p className="text-sm">
                  {isDragActive
                    ? "Drop the Excel file here..."
                    : "Drag and drop an Excel file here, or click to select"}
                </p>
                <p className="text-xs text-gray-500 mt-1">Only .xlsx and .xls files are accepted</p>
              </>
            )}
          </div>
        </div>
        {formik.touched.selectedFile && formik.errors.selectedFile && (
          <div className="text-xs text-support-c300">{String(formik.errors.selectedFile)}</div>
        )}
      </div>

      <div className="flex flex-row gap-2 justify-end items-center">
        <Button
          label="Download template"
          className="w-fit py-3.5 mt-2 px-8"
          onClick={handleDownloadTemplate}
          type="button"
          status="info"
          disabled={Boolean(formik.values.selectedClass && formik.values.selectedFile)}
        />
        <Button label="Process" type="submit" className="w-fit py-3.5 mt-2 px-8" />
      </div>
    </form>
  );
};

export default ImportFileModal;
