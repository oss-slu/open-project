import React from "react";
import { generateUploadDropzone } from "@uploadthing/react";
import { u } from "#url";
import "@uploadthing/react/styles.css";
import toast from "react-hot-toast";

const _UploadDropzone = generateUploadDropzone({
  url: u("/api/files/upload"),
});

export const UploadDropzone = ({
  scope,
  metadata,
  onUploadComplete,
  dropzoneAppearance,
}) => {
  return (
    <>
      <_UploadDropzone
        appearance={dropzoneAppearance}
        endpoint="files"
        headers={{
          "x-scope": scope,
          "x-metadata": JSON.stringify(metadata),
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        }}
        onUploadError={(error) => {
          toast.error("Upload error: " + error);
        }}
        onClientUploadComplete={(f) => {
          onUploadComplete();
          f.forEach((file) =>
            toast.success(`File ${file.name} uploaded successfully`)
          );
        }}
      />
    </>
  );
};
