import React from 'react';

import { useState, useRef, useCallback, useEffect } from "react";

import { Toolbar } from '../../lib/magic-painter/components/Toolbar'
import { usePainter } from '../../lib/magic-painter/hooks/usePainter'

import { getImage, updateImage } from '../../api/whiteboard';
import { useParams } from 'react-router';

export function Whiteboard() {

  const [dataUrl, setDataUrl] = useState("#");
  const [{ canvas, isReady, resize, ...state }, { init, events, ...api }] = usePainter();

  const { id } = useParams<{ id : string }>();

  const elemRef = useRef(undefined);


  const handleDownload = useCallback(() => {
    if (!canvas || !canvas.current) return;
    const data = canvas.current.toDataURL("image/png");
    setDataUrl(data);
    var a = document.createElement("a");
    a.href = data;
    a.download = "image.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [canvas]);

  const toolbarProps = { ...state, ...api, dataUrl, handleDownload };

  const getCanvasAsPng = () : Promise<ArrayBuffer> => {
    return new Promise(resolve => canvas.current.toBlob(resolve))
      .then((blob : Blob) => blob.arrayBuffer())
  }

  events.addEventListener("onDrawEnd", () => {
    getCanvasAsPng().then((img) => updateImage(id, img));
  });

  useEffect(() => { if (!isReady) {
    init();
  } });

  return (
    <div ref={elemRef} style={
        {
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative"
        }
      }>
      <Toolbar {...toolbarProps} style={{position: "absolute"}}/>
      <canvas  ref={canvas} style={{}}/>
    </div>
  );
}
