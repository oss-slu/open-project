import useSWRMutation from "swr/mutation";
import { authFetchWithoutContentType } from "../util/url";
import toast from "react-hot-toast";

const uploadFiles = async (url, { arg }) => {
  const formData = new FormData();

  Array.from(arg).forEach((file) => {
    formData.append("files", file);
  });

  const response = await authFetchWithoutContentType(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = "File upload failed";
    try {
      const errorData = await response.json();
      errorMessage = errorData?.message || response.statusText;
    } catch (parseError) {
      errorMessage = response.statusText || "Unknown error";
      console.log(parseError);
    }
    console.error("Upload error:", errorMessage);
    throw errorMessage;
  }

  return await response.json();
};

export const useFileUploader = (endpoint, options) => {
  const { onSuccessfulUpload } = options || {};

  const { trigger, data, error, isMutating } = useSWRMutation(
    endpoint,
    uploadFiles,
    {
      throwOnError: false,
    }
  );

  const upload = async (fileOrFiles) => {
    if (
      !fileOrFiles ||
      (Array.isArray(fileOrFiles) && fileOrFiles.length === 0)
    ) {
      throw { message: "No files provided", status: 400 };
    }

    return trigger(fileOrFiles)
      .catch((err) => {
        console.error("Upload failed in hook:", err);
        throw err; // Ensure error propagates correctly
      })
      .finally(() => {
        if (!error) {
          toast.success("File uploaded successfully");
          if (onSuccessfulUpload) {
            onSuccessfulUpload(data);
          }
        }
      });
  };

  return {
    upload,
    data,
    loading: isMutating,
    error,
  };
};
