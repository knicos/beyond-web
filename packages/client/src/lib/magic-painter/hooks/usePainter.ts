import { clear } from "console";
import { useCallback, useRef, useState } from "react";

export const usePainter = () => {
  const canvas = useRef<HTMLCanvasElement>();
  const [isReady, setIsReady] = useState(false);
  const [isRegularMode, setIsRegularMode] = useState(true);
  const [isAutoWidth, setIsAutoWidth] = useState(false);
  const [isEraser, setIsEraser] = useState(false);

  const [currentColor, setCurrentColor] = useState("#000000");
  const [currentWidth, setCurrentWidth] = useState(25);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const selectedSaturation = useRef(100);
  const selectedLightness = useRef(50);
  const selectedColor = useRef("#000000");
  const backgroundColor = useRef("#eeeeee");
  const selectedLineWidth = useRef(50);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const hue = useRef(0);
  const isDrawing = useRef(false);
  const isRegularPaintMode = useRef(true);
  const isEraserMode = useRef(false);

  const events = new EventTarget();
  const eventOnDrawEnd = new Event("onDrawEnd");

  const ctx = useRef(canvas?.current?.getContext("2d"));

  const drawOnCanvas = useCallback((event: any) => {
    if (!ctx || !ctx.current) {
      return;
    }
    ctx.current.beginPath();
    ctx.current.moveTo(lastX.current, lastY.current);
    ctx.current.lineTo(event.offsetX, event.offsetY);
    ctx.current.stroke();

    [lastX.current, lastY.current] = [event.offsetX, event.offsetY];
  }, []);

  const handleMouseDown = useCallback((e: any) => {
    isDrawing.current = true;
    [lastX.current, lastY.current] = [e.offsetX, e.offsetY];
  }, []);

  const drawNormal = useCallback(
    (e: any) => {
      if (!isDrawing.current || !ctx.current) return;

      ctx.current.strokeStyle = selectedColor.current;
      ctx.current.lineJoin = "round";
      ctx.current.lineCap = "round";

      setCurrentColor(selectedColor.current);

      ctx.current.lineWidth = selectedLineWidth.current;

      isEraserMode.current
        ? (ctx.current.globalCompositeOperation = "destination-out")
        : (ctx.current.globalCompositeOperation = "source-over");
      drawOnCanvas(e);
    },
    [drawOnCanvas],
  );

  const stopDrawing = useCallback(() => {
    if (isDrawing.current === true)
    {
      events.dispatchEvent(eventOnDrawEnd);
    }
    isDrawing.current = false;
  }, []);

  const clearCanvas = () => {
    ctx.current.fillStyle = backgroundColor.current;
    ctx.current.fillRect(0, 0, canvas.current.width, canvas.current.height);
  }

  const resize = useCallback(() => {
    var tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = canvas.current.width;
    tmpCanvas.height = canvas.current.height;
    var tmpCtx = tmpCanvas.getContext("2d");

    tmpCtx.drawImage(canvas.current, 0, 0);

    canvas.current.width = canvas.current.parentElement.clientWidth;
    canvas.current.height = canvas.current.parentElement.clientHeight;

    clearCanvas();

    ctx.current.drawImage(tmpCanvas, 0, 0);
  }, []);

  const init = useCallback(() => {
    ctx.current = canvas?.current?.getContext("2d");
    if (canvas && canvas.current && ctx && ctx.current) {
      canvas.current.addEventListener("mousedown", handleMouseDown);
      canvas.current.addEventListener("mousemove", drawNormal);
      canvas.current.addEventListener("mouseup", stopDrawing);
      canvas.current.addEventListener("mouseout", stopDrawing);

      resize();

      ctx.current.strokeStyle = "#000";

      setIsReady(true);
    }
  }, [drawNormal, handleMouseDown, stopDrawing]);

  const handleRegularMode = useCallback(() => {
    setIsRegularMode(true);
    isEraserMode.current = false;
    setIsEraser(false);
    isRegularPaintMode.current = true;
  }, []);

  const handleSpecialMode = useCallback(() => {
    setIsRegularMode(false);
    isEraserMode.current = false;
    setIsEraser(false);
    isRegularPaintMode.current = false;
  }, []);

  const handleColor = (e: any) => {
    setCurrentColor(e.currentTarget.value);
    selectedColor.current = e.currentTarget.value;
  };

  const handleWidth = (e: any) => {
    setCurrentWidth(e.currentTarget.value);
    selectedLineWidth.current = e.currentTarget.value;
  };

  const handleClear = useCallback(() => {
    if (!ctx || !ctx.current || !canvas || !canvas.current) {
      return;
    }
    clearCanvas();
    events.dispatchEvent(eventOnDrawEnd);
  }, []);

  const handleEraserMode = (e: any) => {
    setIsAutoWidth(false);
    setIsRegularMode(true);
    isEraserMode.current = true;
    setIsEraser(true);
  };

  const setCurrentSaturation = (e: any) => {
    setCurrentColor(
      `hsl(${hue.current},${e.currentTarget.value}%,${selectedLightness.current}%)`,
    );
    selectedSaturation.current = e.currentTarget.value;
  };

  const setCurrentLightness = (e: any) => {
    setCurrentColor(
      `hsl(${hue.current},${selectedSaturation.current}%,${e.currentTarget.value}%)`,
    );
    selectedLightness.current = e.currentTarget.value;
  };

  const toggleFullscreen = () => {
    let lIsFullscreen = isFullscreen;
    if ((document.fullscreenElement === null) && lIsFullscreen) {
      // not in fullscreen mode
      lIsFullscreen = false;
    }

    if (lIsFullscreen) {
      document.exitFullscreen().finally(
        () => {
          resize();
          setIsFullscreen(false);
        });
    } else {
      canvas.current?.parentElement.parentElement.requestFullscreen().then(
        () => {
          setIsFullscreen(true);
          resize();
        },
        () => setIsFullscreen(false)
      );
    }
  }

  return [
    {
      canvas,
      isReady,
      currentWidth,
      currentColor,
      isRegularMode,
      isAutoWidth,
      isEraser,
      resize,
    },
    {
      init,
      events,
      handleRegularMode,
      handleSpecialMode,
      handleColor,
      handleWidth,
      handleClear,
      handleEraserMode,
      setCurrentSaturation,
      setCurrentLightness,
      toggleFullscreen
    },
  ] as any;
};
