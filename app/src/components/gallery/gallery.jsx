import React from "react";
import PropTypes from "prop-types";
import { Icon } from "#icon";

export const Gallery = ({ images, lastSlide }) => (
  <div
    id="carousel-sample"
    className="carousel slide"
    data-bs-ride="carousel"
    style={{ height: 200 }}
  >
    <div className="carousel-indicators">
      {images.map((_, index) => (
        <button
          key={index}
          type="button"
          data-bs-target="#carousel-sample"
          data-bs-slide-to={index}
          className={index === 0 ? "active" : ""}
        ></button>
      ))}
      {lastSlide && (
        <button
          type="button"
          data-bs-target="#carousel-sample"
          data-bs-slide-to={images.length}
        ></button>
      )}
    </div>

    <div className="carousel-inner" style={{ height: "100%" }}>
      {images.map((image, index) => (
        <div
          key={index}
          className={`carousel-item ${index === 0 ? "active" : ""}`}
          style={{ height: "100%" }}
        >
          <img
            className="d-block w-100"
            src={image.fileUrl || image.file?.location}
            alt={image.fileName || image.file?.name}
            style={{
              height: "100%",
              objectFit: "contain",
            }}
          />
        </div>
      ))}
      {lastSlide && <div className="carousel-item">{lastSlide}</div>}
    </div>

    <a
      className="carousel-control-prev"
      href="#carousel-sample"
      role="button"
      data-bs-slide="prev"
    >
      <Icon i="arrow-left" size={24} color={"black"} />
      <span className="visually-hidden">Previous</span>
    </a>

    <a
      className="carousel-control-next"
      href="#carousel-sample"
      role="button"
      data-bs-slide="next"
    >
      <Icon i="arrow-right" size={24} color={"black"} />
      <span className="visually-hidden">Next</span>
    </a>
  </div>
);

Gallery.propTypes = {
  images: PropTypes.arrayOf(
    PropTypes.shape({
      fileUrl: PropTypes.string.isRequired,
      fileName: PropTypes.string.isRequired,
    })
  ).isRequired,
  lastSlide: PropTypes.node,
};
