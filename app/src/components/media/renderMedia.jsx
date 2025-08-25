import React, { useState, useEffect, useRef } from "react";
import styles from "./renderMedia.module.css";
import { StlViewer } from "react-stl-viewer";
import classNames from "classnames";

export const RenderMedia = ({
  mediaUrl,
  thumbnailUrl,
  fileType: originalFileType,
  big = false,
  small = false,
}) => {
  const [preview, setPreview] = useState(true);
  const timeoutRef = useRef(null);
  const fileType = originalFileType?.toLowerCase();

  const handleMouseOut = () => {
    timeoutRef.current = setTimeout(() => {
      setPreview(true);
    }, 5 * 1000); // 10 seconds
  };

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    setPreview(false);
  };

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => clearTimeout(timeoutRef.current);
  }, []);

  if (
    fileType === "png" ||
    fileType === "jpg" ||
    fileType === "jpeg" ||
    fileType === "webp"
  ) {
    return (
      <img
        src={mediaUrl}
        className={classNames(
          styles.image,
          big ? styles.big : "",
          small ? styles.small : ""
        )}
        alt="media"
      />
    );
  }

  if (fileType === "stl") {
    if (preview && thumbnailUrl && !big) {
      return (
        <img
          src={thumbnailUrl}
          className={classNames(
            styles.image,
            big ? styles.big : "",
            small ? styles.small : ""
          )}
          alt="media"
          onClick={() => setPreview(false)}
        />
      );
    }

    return (
      <StlViewer
        className={classNames(
          styles.image,
          big ? styles.big : "",
          small ? styles.small : ""
        )}
        orbitControls
        shadows
        url={mediaUrl}
        onMouseOut={handleMouseOut}
        onMouseEnter={handleMouseEnter}
        modelProps={{
          color: "rgb(83, 195, 238)",
        }}
        cameraProps={{
          initialPosition: {
            distance: 1,
          },
        }}
      />
    );
  }

  if (fileType === "pdf") {
    return (
      <iframe
        src={mediaUrl}
        className={classNames(
          styles.image,
          big ? styles.big : "",
          small ? styles.small : ""
        )}
        title="PDF"
      />
    );
  }

  return (
    <div
      className={classNames(
        styles.unsupported,
        big ? styles.big : "",
        small ? styles.small : ""
      )}
    >
      {fileType}
      <i>Rendering is not supported for this file type</i>
    </div>
  );
};
