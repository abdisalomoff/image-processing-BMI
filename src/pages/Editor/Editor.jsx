import React, { useRef, useContext, useEffect, useState } from "react";
import { ImageContext } from "@/ImageProvider";
import "./Editor.css";

import ButtonIcon from "@components/ButtonIcon/ButtonIcon";
import Modal from "@components/Modal/Modal";
import Input from "@components/Input/Input";
import Dropdown from "@components/Dropdown/Dropdown";
import ScalingModal from "./ScalingModal/ScalingModal";
import ContextModal from "@components/ContextModal/ContextModal";

import {
  updateTranslation,
  handleKeyDown,
  handleKeyUp,
  handleMouseUp,
  handleMouseDown,
} from "@utils/CanvasChange/canvasKeyHand";
import {
  extractRGB,
  rgbToXyz,
  rgbToLab,
  calculateContrast,
} from "@utils/RonvertColours/ronvertColours";
import CurvesModal from "./CurvesModal/CurvesModal";
import FilterModal from "./FilterModal/FilterModal";

const Editor = () => {
  const { image, setImage } = useContext(ImageContext);

  const [toolActive, setToolActive] = useState("cursor");
  const [pipetteColor1, setPipetteColor1] = useState("");
  const [pipetteColor2, setPipetteColor2] = useState("");
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [fileSize, setFileSize] = useState(0);
  const [scaleFactor, setScaleFactor] = useState(0);
  const [selectOption, setSelectOption] = useState(null);
  const [infoActive, setInfoActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [canvasTranslation, setCanvasTranslation] = useState({ x: 0, y: 0 });
  const [imageCoordinatesBase, setImageCoordinatesBase] = useState({
    x: 0,
    y: 0,
  });
  const [imageCoordinatesExtra, setImageCoordinatesExtra] = useState({
    x: 0,
    y: 0,
  });
  const [handStep, setHandStep] = useState(10);
  const [showBg, setShowBg] = useState(false);

  // Modal oyna bilan ishlash
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalCurvesOpen, setIsModalCurvesOpen] = useState(false);
  const [isModalFilterOpen, setIsModalFilterOpen] = useState(false);
  const openModal = () => {
    setIsModalOpen(true);
    setToolActive("cursor");
  };
  const openCurvesModal = () => {
    setIsModalCurvesOpen(true);
    setToolActive("cursor");
  };
  const openFilterModal = () => {
    setIsModalFilterOpen(true);
    setToolActive("cursor");
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setIsModalCurvesOpen(false);
    setIsModalFilterOpen(false);
  };
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const openContextModal = () => {
    setIsContextModalOpen(true);
    setToolActive("cursor");
    setInfoActive(true);
  };
  const closeContextModal = () => {
    setIsContextModalOpen(false);
    setToolActive("cursor");
    setInfoActive(false);
  };

  const onSelectScale = (ctx) => setScaleFactor(ctx / 100);

  const imageObj = new Image();
  imageObj.src = image;

  const canvas = useRef();
  const context = useRef();
  const animationFrameId = useRef(null);

  useEffect(() => {
    if (!image) return;

    const imageObj = new Image();
    imageObj.src = image;
    imageObj.crossOrigin = "anonymous";

    const workspace = document.querySelector(".workspace");
    const workspaceWidth = workspace.offsetWidth;
    const workspaceHeight = workspace.offsetHeight;
    const maxWidth = workspaceWidth - 100;
    const maxHeight = workspaceHeight - 100;

    imageObj.onload = () => {
      const widthScale = maxWidth / imageObj.width;
      const heightScale = maxHeight / imageObj.height;
      const newScaleFactor = Math.min(widthScale, heightScale);
      scaleFactor !== 0 || setScaleFactor(newScaleFactor);
      const scaledWidth = imageObj.width * scaleFactor;
      const scaledHeight = imageObj.height * scaleFactor;

      const canvasElement = canvas.current;
      context.current = canvasElement.getContext("2d");
      context.imageSmoothingEnabled = true;
      imageObj.willReadFrequently = true;

      canvasElement.width = workspaceWidth;
      canvasElement.height = workspaceHeight;
      context.current.clearRect(
        0,
        0,
        canvasElement.width,
        canvasElement.height
      );
      context.current.drawImage(
        imageObj,
        canvasTranslation.x + (maxWidth - scaledWidth) / 2 + 50,
        canvasTranslation.y + (maxHeight - scaledHeight) / 2 + 50,
        scaledWidth,
        scaledHeight
      );
      setWidth(scaledWidth);
      setHeight(scaledHeight);

      setSelectOption(Math.round(newScaleFactor * 100));
      setFileSize(Math.floor((imageObj.src.length / 1024) * 0.77));

      const handleWheel = (event) => {
        event.preventDefault();
        const isCtrlPressed = event.ctrlKey || event.metaKey;
        const isTwoFingerScroll =
          event.deltaMode === 0 && Math.abs(event.deltaY) > 100;

        if (isCtrlPressed || isTwoFingerScroll) {
          const delta = event.deltaY;
          const newScaleFactor = scaleFactor + delta * 0.001; // Masshtabni o'zgartirish tezligini ko'paytirish uchun ko'paytiruvchi
          setScaleFactor(Math.min(Math.max(0.1, newScaleFactor), 300));
        }
      };

      canvasElement.addEventListener("wheel", handleWheel);

      return () => {
        canvasElement.removeEventListener("wheel", handleWheel);
      };
    };
  }, [
    image,
    scaleFactor,
    canvasTranslation.x,
    canvasTranslation.y,
    isModalCurvesOpen,
    isModalFilterOpen,
  ]);

  const handleCanvasClick = (event) => {
    const canvasRef = canvas.current;
    const x = event.nativeEvent.offsetX;
    const y = event.nativeEvent.offsetY;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvasRef.width;
    tempCanvas.height = canvasRef.height;
    tempCanvas.willReadFrequently = true;
    const tempContext = tempCanvas.getContext("2d");
    tempContext.drawImage(canvasRef, 0, 0);

    const paddingW = document.querySelector(".workspace").offsetWidth - width;
    const paddingH = document.querySelector(".workspace").offsetHeight - height;

    const pixelData = tempContext.getImageData(x, y, 1, 1).data;
    const color = `rgb(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]})`;
    toolActive === "pipette" && console.log("Выбранный цвет:", color);
    if (toolActive === "pipette") {
      if (event.altKey) {
        setPipetteColor2(color);
        setImageCoordinatesExtra({
          x: x - paddingW / 2 - canvasTranslation.x,
          y: y - paddingH / 2 - canvasTranslation.y,
        });
      } else {
        setPipetteColor1(color);
        setImageCoordinatesBase({
          x: x - paddingW / 2 - canvasTranslation.x,
          y: y - paddingH / 2 - canvasTranslation.y,
        });
      }
    }
  };

  const updateImage = (image) => {
    console.log(image);
    setImage(image);
  };

  // qo'l

  useEffect(() => {
    const handleKeyDownEvent = (e) =>
      handleKeyDown(
        handStep,
        toolActive,
        canvasTranslation,
        setCanvasTranslation,
        e
      );
    document.body.addEventListener("keydown", handleKeyDownEvent);
    return () => {
      document.body.removeEventListener("keydown", handleKeyDownEvent);
    };
  }, [toolActive, canvasTranslation, setCanvasTranslation]);

  const handleMouseMove = (e) => {
    const rect = canvas.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Agar kursor canvas ichida bo'lsa, yangilanadi
    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      setCursor({ x, y });
    }

    // Rasmni tortib ko'chirish
    if (isDragging && toolActive === "hand") {
      const dx = e.clientX - rect.left - cursor.x;
      const dy = e.clientY - rect.top - cursor.y;
      updateTranslation(
        animationFrameId,
        canvasTranslation,
        setCanvasTranslation,
        dx,
        dy,
        width,
        height,
        scaleFactor
      );
    }
  };
  const handleKeyDownEvent = (e) =>
    handleKeyDown(
      handStep,
      toolActive,
      canvasTranslation,
      setCanvasTranslation,
      e
    );
  const handleKeyUpEvent = (e) =>
    handleKeyUp(toolActive, canvasTranslation, setCanvasTranslation, e);
  const handleMouseUpEvent = () => handleMouseUp(setIsDragging);
  const handleMouseDownEvent = () => handleMouseDown(toolActive, setIsDragging);

  useEffect(() => {
    const handleKeyDownShortcut = (event) => {
      switch (event.code) {
        case "KeyC":
          setToolActive("cursor");
          break;
        case "KeyP":
          setToolActive("pipette");
          setInfoActive(true);
          break;
        case "KeyH":
          setToolActive("hand");
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDownShortcut);

    return () => {
      window.removeEventListener("keydown", handleKeyDownShortcut);
    };
  }, []);

  const handleDownload = () => {
    const canvasRef = canvas.current;
    const context = canvasRef.getContext("2d");

    const imageObj = new Image();
    imageObj.src = image;
    imageObj.crossOrigin = "anonymous";

    imageObj.onload = () => {
      canvasRef.width = imageObj.width;
      canvasRef.height = imageObj.height;
      context.drawImage(imageObj, 0, 0);
      const url = canvasRef.toDataURL();
      const a = document.createElement("a");
      document.body.appendChild(a);
      a.href = url;
      a.download = "editedImage.png";
      a.click();
      document.body.removeChild(a);
    };
  };

  const showPreview = (value) => {
    setShowBg(value);
  };

  return (
    <section className="editor">
      <div className="editor__menu-bar menu-bar">
        <div className="menu-bar__actions">
          <ButtonIcon link="/">Bosh menyu</ButtonIcon>
          {image && (
            <>
              <ButtonIcon title="Скачать" onClick={handleDownload}>
                Yuklab olish
              </ButtonIcon>
              <ButtonIcon title="Масштабирование" onClick={openModal}>
                Masshtablash
              </ButtonIcon>
              <ButtonIcon title="Кривые" onClick={openCurvesModal}>
                Gistogramma
              </ButtonIcon>
              <ButtonIcon title="Фильтрация" onClick={openFilterModal}>
                Filtrlash
              </ButtonIcon>
            </>
          )}
        </div>
        {image && (
          <div className="menu-bar__regulators">
            {toolActive === "hand" && (
              <div className="menu-bar__speed">
                <p className="menu-bar__desc">Harakatlanish tezligi</p>
                <Input
                  w100
                  type="number"
                  value={handStep}
                  onChange={setHandStep}
                  placeholder="Kursor harakatlanish tezligi"
                />
              </div>
            )}
            <div className="menu-bar__size">
              <p className="menu-bar__desc">Tasvir masshtabini % da</p>
              {selectOption && (
                <Dropdown
                  selectOption={selectOption}
                  options={Array.from({ length: 289 }, (_, i) => i + 12)}
                  onSelect={onSelectScale}
                />
              )}
            </div>
          </div>
        )}
      </div>
      <div className="editor__tool-panel tool-panel">
        <ButtonIcon
          title="Kursor"
          onClick={() => {
            setToolActive("cursor");
          }}
          active={toolActive === "cursor"}
          tooltip="Ob'ektlar bilan ishlash va boshqa vositalarni tiklash uchun oddiy ko'rsatgich."
        >
          <svg
            className="tool-panel__icon"
            role="img"
            fill="currentColor"
            viewBox="0 0 18 18"
            id="SSelect18N-icon"
            width="18"
            height="18"
            aria-hidden="true"
            aria-label=""
            focusable="false"
          >
            <path
              fillRule="evenodd"
              d="M4.252,1.027A.25.25,0,0,0,4,1.277V17.668a.25.25,0,0,0,.252.25.246.246,0,0,0,.175-.074L9.262,13h6.5a.25.25,0,0,0,.176-.427L4.427,1.1A.246.246,0,0,0,4.252,1.027Z"
            ></path>
          </svg>
        </ButtonIcon>
        <ButtonIcon
          title="Пипетка"
          onClick={() => {
            setToolActive("pipette");
          }}
          active={toolActive === "pipette"}
          tooltip="Pipetka vositasi tasvirdagi ranglarni tanlash imkonini beradi. Rangini olish uchun rasmdagi piksel ustiga bosing. Ranglar palitrasi bilan ishlashda va tegishli soyalarni tanlashda foydalidir."
        >
          <svg
            className="tool-panel__icon"
            role="img"
            fill="currentColor"
            viewBox="0 0 18 18"
            id="SSampler18N-icon"
            width="18"
            height="18"
            aria-hidden="true"
            aria-label=""
            focusable="false"
          >
            <path
              fillRule="evenodd"
              d="M11.228,8.519,4.116,15.631a1.235,1.235,0,1,1-1.747-1.747L9.481,6.772Zm3.636-7.466a1.8,1.8,0,0,0-1.273.527L11.328,3.843l-.707-.707a.5.5,0,0,0-.707,0L8.234,4.817a.5.5,0,0,0,0,.707l.54.54L1.662,13.177a2.235,2.235,0,1,0,3.161,3.161l7.113-7.112.54.54a.5.5,0,0,0,.707,0l1.681-1.68a.5.5,0,0,0,0-.707l-.707-.707L16.42,4.409a1.8,1.8,0,0,0,0-2.546l-.283-.283a1.8,1.8,0,0,0-1.273-.527Z"
            ></path>
          </svg>
        </ButtonIcon>
        <ButtonIcon
          title="Рука"
          onClick={() => {
            setToolActive("hand");
          }}
          active={toolActive === "hand"}
          tooltip="Tasvirni ko'rish maydonini ko'chirish uchun vosita. Tasvirni ish maydoni bo'ylab siljitish uchun shunchaki sichqoncha tugmasini bosib ushlab turing va torting. Katta tasvirlar bilan ishlash va tafsilotlarni ko'rish uchun qulay."
        >
          <svg
            className="tool-panel__icon"
            role="img"
            fill="currentColor"
            height="18"
            viewBox="0 0 512 512"
            width="18"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title />
            <path d="M82.42,209.08h0c15.06-6.62,32.38,1.31,38.5,17.62L156,312h11.27V80c0-17.6,13.3-32,29.55-32h0c16.26,0,29.55,14.4,29.55,32V231.75l14.78.25V32c0-17.6,13.3-32,29.55-32h0C287,0,300.25,14.4,300.25,32V231.75L315,232V64c0-17.6,13.3-32,29.55-32h0c16.26,0,29.55,14.4,29.55,32V247.75l14.78.25V128c0-17.6,13.3-32,29.55-32h0C434.7,96,448,110.4,448,128V344c0,75.8-37.13,168-169,168-40.8,0-79.42-7-100.66-21a121.41,121.41,0,0,1-33.72-33.31,138,138,0,0,1-16-31.78L66.16,250.77C60.05,234.46,67.36,215.71,82.42,209.08Z" />
          </svg>
        </ButtonIcon>
      </div>
      <div className="editor__info-panel info-panel">
        <ButtonIcon
          title="Ma'lumot"
          onClick={() => {
            setInfoActive(!infoActive);
            !infoActive ? openContextModal() : closeContextModal();
          }}
          active={infoActive}
        >
          <svg
            className="tool-panel__icon"
            role="img"
            fill="currentColor"
            viewBox="0 0 32 32"
            width="18"
            height="18"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g data-name="Layer 2" id="Layer_2">
              <path d="M16,12a2,2,0,1,1,2-2A2,2,0,0,1,16,12Zm0-2Z" />
              <path d="M16,29A13,13,0,1,1,29,16,13,13,0,0,1,16,29ZM16,5A11,11,0,1,0,27,16,11,11,0,0,0,16,5Z" />
              <path d="M16,24a2,2,0,0,1-2-2V16a2,2,0,0,1,4,0v6A2,2,0,0,1,16,24Zm0-8v0Z" />
            </g>
          </svg>
        </ButtonIcon>
      </div>
      <ContextModal
        isOpen={isContextModalOpen || toolActive === "pipette"}
        onClose={closeContextModal}
        title="Ma'lumot"
      >
        <div className="editor__all-colors">
          <div className="editor__info-color">
            <p className="status-bar__text">&nbsp;</p>
            <div className="status-bar__color"></div>
            <p className="status-bar__text">
              <span
                className="tooltip"
                data-tooltip="RGB (кirmizi, yashil, ko'k) qo'shimcha ranglar modelini ifodalaydi, har bir pikselni qizil, yashil va ko'k ranglarining kombinatsiyasi belgilayadi. Osiyalar alohida kanallarni ifodalaydi: kirmizi (R), yashil (G) va ko'k (B), ularning har biri 0 dan 255 gacha bo'lgan qiymatlar diapazoniga ega."
              >
                &#9432;
              </span>
              <span> RGB</span>
            </p>
            <p className="status-bar__text">
              <span
                className="tooltip"
                data-tooltip="XYZ absolut rang modelini ifodalaydi va qurilma qurilmalariga qarashsiz rangni tasvirlash uchun ishlatiladi. Ushbu doiraning o'shishlari uchta komponentni ifodalaydi: X, Y va Z, ularga rangni, uni kengligi, qizil va yashil tarkibini tushuntiradi. Qiymatlar diapazoni ma'lum bir qurilma asosida o'zgaradi, odatda X va Y 0 dan 1 gacha, Z esa 0 dan 1 gacha bo'lgan cheklangan diapazonda joylashadi."
              >
                &#9432;
              </span>
              <span> XYZ</span>
            </p>
            <p className="status-bar__text">
              <span
                className="tooltip"
                data-tooltip=" Laboratoriya - bu rangni inson ko'zi bilan idrok etishga asoslangan rang modeli. Ushbu bo'shliqning o'qlari L (yorqinlik), a (yashildan qizil ranggacha) va b (rang ko'kdan sariq ranggacha) o'z ichiga oladi. L qiymatlari 0 dan 100 gacha, a va b qiymatlari esa -128 dan 127 gacha."
              >
                &#9432;
              </span>
              <span> Lab</span>
            </p>
            <p className="status-bar__text">xy</p>
          </div>
          <div className="editor__info-color">
            <p className="status-bar__text">Color #1:&nbsp;</p>
            <div
              className="status-bar__color"
              style={{ backgroundColor: pipetteColor1 }}
            ></div>
            <p className="status-bar__text">&nbsp;{pipetteColor1}</p>
            <p className="status-bar__text">
              &nbsp;{pipetteColor1 && rgbToXyz(extractRGB(pipetteColor1))}
            </p>
            <p className="status-bar__text">
              &nbsp;{pipetteColor1 && rgbToLab(extractRGB(pipetteColor1))}
            </p>
            <p className="status-bar__text">
              &nbsp;({imageCoordinatesBase.x.toFixed(0)},{" "}
              {imageCoordinatesBase.y.toFixed(0)})
            </p>
          </div>
          <div className="editor__info-color">
            <p className="status-bar__text">Color #2 (alt yoki option):&nbsp;</p>
            <div
              className="status-bar__color"
              style={{ backgroundColor: pipetteColor2 }}
            ></div>
            <p className="status-bar__text">&nbsp;{pipetteColor2}</p>
            <p className="status-bar__text">
              &nbsp;{pipetteColor2 && rgbToXyz(extractRGB(pipetteColor2))}
            </p>
            <p className="status-bar__text">
              &nbsp;{pipetteColor2 && rgbToLab(extractRGB(pipetteColor2))}
            </p>
            <p className="status-bar__text">
              &nbsp;({imageCoordinatesExtra.x.toFixed(0)},{" "}
              {imageCoordinatesExtra.y.toFixed(0)})
            </p>
          </div>
          <p className="editor__contrast-info">
            Kontrast{" "}
            {pipetteColor1 &&
              pipetteColor2 &&
              calculateContrast(
                extractRGB(pipetteColor1),
                extractRGB(pipetteColor2)
              )}
          </p>
        </div>
      </ContextModal>
      <div
        className={
          "editor__workspace workspace" +
          (toolActive === "hand" ? " workspace--hand" : "")
        }
      >
        <canvas
          className={
            toolActive === "pipette"
              ? "workspace__canvas workspace__canvas--pipette"
              : "workspace__canvas"
          }
          ref={canvas}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDownEvent}
          onMouseUp={handleMouseUpEvent}
          onKeyDown={!isModalOpen ? handleKeyDownEvent : null}
          onKeyUp={!isModalOpen ? handleKeyUpEvent : null}
          style={{
            cursor:
              toolActive === "hand"
                ? "grab"
                : toolActive === "pipette"
                ? "crosshair"
                : "default",
          }}
        />
      </div>
      <div className="editor__status-bar status-bar">
        {image && (
          <>
            <span className="status-bar__text">
              O'lchamlari: {Math.round(width)}&nbsp;x&nbsp;{Math.round(height)}
              &nbsp;px
            </span>
            <span className="status-bar__text">
              Fayl hajmi: {fileSize}&nbsp;Кб
            </span>
            <span className="status-bar__text">
              Kordinatalari: x&nbsp;{cursor.x}; y&nbsp;{cursor.y}
            </span>
          </>
        )}
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Tasvirni masshtablash"
      >
        <ScalingModal
          image={imageObj}
          setImage={updateImage}
          closeModal={closeModal}
        />
      </Modal>
      <Modal
        w80
        bg0={showBg}
        isOpen={isModalCurvesOpen}
        onClose={closeModal}
        title="Tasvir gistogrammasi"
      >
        {isModalCurvesOpen && (
          <CurvesModal
            imageCtx={context}
            setImage={updateImage}
            closeModal={closeModal}
            showPreview={showPreview}
          />
        )}
      </Modal>
      <Modal
        bg0={showBg}
        isOpen={isModalFilterOpen}
        onClose={closeModal}
        title="Tasvirni filtrlash"
      >
        {isModalFilterOpen && (
          <FilterModal
            imageCtx={context}
            setImage={updateImage}
            closeModal={closeModal}
            showPreview={showPreview}
          />
        )}
      </Modal>
    </section>
  );
};

export default Editor;
