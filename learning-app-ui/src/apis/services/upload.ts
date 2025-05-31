// import axios from "axios";

// const API_DOMAIN = process.env.NEXT_PUBLIC_HTTP_API_DOMAIN;

// export interface UploadFileResponse {
//   url: string;
// }

// export interface UploadFilePayload {
//   file: File;
//   folder?: string;
// }

// export const uploadFile = async (payload: UploadFilePayload): Promise<UploadFileResponse> => {
//   const { file, folder } = payload;

//   const formData = new FormData();
//   formData.append("file", file);
//   if (folder) {
//     formData.append("folder", folder);
//   }

//   try {
//     const response = await axios.post(`${API_DOMAIN}/upload`, formData, {
//       headers: {
//         "Content-Type": "multipart/form-data",
//       },
//     });

//     return response.data;
//   } catch (error: any) {
//     throw error?.response?.data || error.message;
//   }
// };
