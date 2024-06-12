import React, { useState, useEffect, useContext } from "react";
import "./ScalingModal.css";
import PropTypes from "prop-types";
import Dropdown from "@components/Dropdown/Dropdown";
import Input from "@components/Input/Input";
import TheButton from "@components/Button/TheButton";
import { ImageContext } from "@/ImageProvider";
import nearestNeighborInterpolation from "@utils/ImageProcessing/NearestNeighborInterpolation";

const ScalingModal = ({ image, closeModal }) => {
  const { setImage } = useContext(ImageContext);
  const [resizeMode, setResizeMode] = useState("Pikselda");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(0);
  const [interpolationAlgorithm, setInterpolationAlgorithm] =
    useState("Eng yaqin qo'shnisi");
  const [initialPixels, setInitialPixels] = useState(0);
  const [resizedPixels, setResizedPixels] = useState(0);
  // Для ошибок ввода
  const [widthError, setWidthError] = useState("");
  const [heightError, setHeightError] = useState("");

  useEffect(() => {
    if (!image) return;
    setInitialPixels(((image.width * image.height) / 1000000).toFixed(2));
    setHeight(image.height);
    setWidth(image.width);
    setResizedPixels(((width * height) / 1000000).toFixed(2));
    setAspectRatio(image.width / image.height);
  }, [image]);

  useEffect(() => {
    if (resizeMode == "Foizlarda") {
      setWidth(100);
      setHeight(100);
    } else {
      setWidth(image.width);
      setHeight(image.height);
    }
  }, [resizeMode]);

  useEffect(() => {
    if (!Number.isInteger(Number(height)) || Number(height) <= 0) {
      setHeightError("⚠ Balandlik butun musbat son bo'lishi kerak");
    } else {
      setHeightError("");
    }
    if (!Number.isInteger(Number(width)) || Number(width) <= 0) {
      setWidthError("⚠ Kenglik butun musbat son bo'lishi kerak");
    } else {
      setWidthError("");
    }
  }, [height, width]);

  const handleWidthChange = (value) => {
    setWidth(value);
    if (lockAspectRatio) {
      const newHeight = resizeMode === "Foizlar" ? value : value / aspectRatio;
      setHeight(Math.round(newHeight));
      setResizedPixels(
        (
          (resizeMode === "Foizlar"
            ? image.height * image.width * (value / 100) ** 2
            : newHeight * value) / 1000000
        ).toFixed(2)
      );
    } else {
      setResizedPixels(
        (
          (resizeMode === "Foizlar"
            ? (((image.height * image.width * value) / 100) * height) / 100
            : height * value) / 1000000
        ).toFixed(2)
      );
    }
  };

  const handleHeightChange = (value) => {
    setHeight(value);
    if (lockAspectRatio) {
      const newWidth = resizeMode === "Foizlar" ? value : value * aspectRatio;
      setWidth(Math.round(newWidth));
      setResizedPixels(
        (
          (resizeMode === "Foizlar"
            ? image.height * image.width * (value / 100) ** 2
            : newWidth * value) / 1000000
        ).toFixed(2)
      );
    } else {
      setResizedPixels(
        (
          (resizeMode === "Foizlar"
            ? (((image.height * image.width * value) / 100) * width) / 100
            : width * value) / 1000000
        ).toFixed(2)
      );
    }
  };

  const handleResizeConfirm = () => {
    if (
      heightError || widthError || resizeMode == "Foizlar"
        ? (height * image.height) / 100 > 10000 ||
          (image.width * width) / 100 > 10000
        : height > 10000 || width > 10000
    )
      return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const newWidth =
      resizeMode === "Foizlar"
        ? Math.round((image.width * width) / 100)
        : width;
    const newHeight =
      resizeMode === "Foizlar"
        ? Math.round((image.height * height) / 100)
        : height;
    console.log(newWidth, newHeight);
    canvas.width = newWidth;
    canvas.height = newHeight;
    // Рисование исходного изображения на холсте
    ctx.drawImage(image, 0, 0, newWidth, newHeight);
    // Получение пиксельных данных исходного изображения
    const imageData = ctx.getImageData(0, 0, newWidth, newHeight);
    // Применение алгоритма ближайшего соседа для интерполяции
    if (interpolationAlgorithm === "Ближайший сосед") {
      const resizedImageData = nearestNeighborInterpolation(
        imageData,
        newWidth,
        newHeight
      );
      ctx.putImageData(resizedImageData, 0, 0);
    }
    // Обновление изображения на холсте
    setImage(canvas.toDataURL("image/png"));
    setResizeMode("Pikselda");
    closeModal();
  };

  const handleResizeModeChange = (selectedOption) => {
    setResizeMode(selectedOption);
  };

  const handleInterpolationAlgorithmChange = (selectedOption) => {
    setInterpolationAlgorithm(selectedOption);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <form className="scaling-modal" onSubmit={handleSubmit}>
      <p className="form__text">Asl tasvir o'lchami: {initialPixels} MPx</p>
      <p className="form__text">
        O'zgartirishlardan so'ng o'lcham: {resizedPixels} MPx
      </p>
      <h3 className="form__name">O'lchamlarni sozlash</h3>
      <div className="form__settings">
        <label className="form__label" htmlFor="resize-mode">
          O'lchov birliklari
        </label>
        <Dropdown
          id="resize-mode"
          options={["Foizlar", "Pikselda"]}
          onSelect={handleResizeModeChange}
          selectOption={"Pikselda"}
        />
        <label className="form__label" htmlFor="width">
          Eni
        </label>
        <Input
          type="number"
          id="width"
          value={width}
          onChange={handleWidthChange}
          min={1}
          max={resizeMode === "Foizlar" ? 1000 : 10000}
          step={1}
        />
        <label className="form__label" htmlFor="height">
          Bo'yi
        </label>
        <Input
          type="number"
          id="height"
          value={height}
          onChange={handleHeightChange}
          min={1}
          max={resizeMode === "Foizlar" ? 1000 : 10000}
          step={1}
        />
        <div className="form__lock">
          <svg
            className="form__lock-line"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 19 4.5"
          >
            <line className="lock" y1="0.5" x2="16.5" y2="0.5"></line>
            <line className="lock" x1="16.5" x2="16.5" y2="4.5"></line>
          </svg>
          <button
            className="form__lock-button"
            onClick={() => setLockAspectRatio(!lockAspectRatio)}
          >
            {lockAspectRatio ? (
              <svg
                role="img"
                fill="currentColor"
                viewBox="0 0 18 18"
                id="SLockClosed18N-icon"
                width="18"
                height="18"
                aria-hidden="true"
                aria-label=""
                focusable="false"
              >
                <path
                  fillRule="evenodd"
                  d="M14.5,8H14V7A5,5,0,0,0,4,7V8H3.5a.5.5,0,0,0-.5.5v8a.5.5,0,0,0,.5.5h11a.5.5,0,0,0,.5-.5v-8A.5.5,0,0,0,14.5,8ZM6,7a3,3,0,0,1,6,0V8H6Zm4,6.111V14.5a.5.5,0,0,1-.5.5h-1a.5.5,0,0,1-.5-.5V13.111a1.5,1.5,0,1,1,2,0Z"
                ></path>
              </svg>
            ) : (
              <svg
                role="img"
                fill="currentColor"
                viewBox="0 0 18 18"
                id="SLockOpen18N-icon"
                width="18"
                height="18"
                aria-hidden="true"
                aria-label=""
                focusable="false"
              >
                <path
                  fillRule="evenodd"
                  d="M14.5,8H5.95V5.176A3.106,3.106,0,0,1,9,2a3.071,3.071,0,0,1,2.754,1.709c.155.32.133.573.389.573a.237.237,0,0,0,.093-.018l1.34-.534a.256.256,0,0,0,.161-.236C13.737,2.756,12.083.1,9,.1A5.129,5.129,0,0,0,4,5.146V8H3.5a.5.5,0,0,0-.5.5v8a.5.5,0,0,0,.5.5h11a.5.5,0,0,0,.5-.5v-8A.5.5,0,0,0,14.5,8ZM10,13.111V14.5a.5.5,0,0,1-.5.5h-1a.5.5,0,0,1-.5-.5V13.111a1.5,1.5,0,1,1,2,0Z"
                ></path>
              </svg>
            )}
          </button>
          <svg
            className="form__lock-line"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 19 7"
          >
            <line className="lock" y1="4.5" x2="17" y2="4.5"></line>
            <line className="lock" x1="16.5" x2="16.5" y2="4.5"></line>
          </svg>
        </div>
        <label className="form__label" htmlFor="interpolation-algorithm">
          Interpolyatsiya algoritm
        </label>
        <div className="form__select-iterpolation">
          <Dropdown
            id="interpolation-algorithm"
            options={["Eng yaqini"]}
            onSelect={handleInterpolationAlgorithmChange}
            selectOption={"Eng yaqini"}
          />
          <span
            className="tooltip"
            data-tooltip="Eng yaqin qo'shni algoritmi yangi tasvirdagi har bir piksel uchun asl tasvirdagi eng yaqin pikselning rang qiymatini oladi. Bu oddiy va tezkor algoritm, lekin o'lcham sezilarli darajada o'zgarsa, piksellanishga olib kelishi mumkin."
          >
            &#9432;
          </span>
        </div>
      </div>
      <div className="form__errors">
        {widthError && <p className="form__error">{widthError}</p>}
        {heightError && <p className="form__error">{heightError}</p>}
        {resizeMode == "Foizlar"
          ? ((height * image.height) / 100 > 10000 ||
              (image.width * width) / 100 > 10000) && (
              <p className="form__error">
                ⚠ Rasm eni yoki balandligi 10000px dan oshmasligi kerak (H foiz
                bilan {(height * image.height) / 100}px va W{" "}
                {(image.width * width) / 100}px)
              </p>
            )
          : (height > 10000 || width > 10000) && (
              <p className="form__error">
                ⚠ Rasmning eni yoki balandligi 10000px dan oshmasligi kerak
              </p>
            )}
      </div>
      <TheButton
        className="form__button"
        accent={true}
        onClick={handleResizeConfirm}
      >
        Bajarish
      </TheButton>
    </form>
  );
};

ScalingModal.propTypes = {
  image: PropTypes.object,
  scaleFactor: PropTypes.number,
  setImage: PropTypes.func,
  closeModal: PropTypes.func,
};

export default ScalingModal;
