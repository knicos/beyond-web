import {
  faArrowsAltH,
  faEraser,
  faMagic,
  faPaintBrush,
  faExpand,
  faSave
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { BrushPreview } from "./BrushPreview";

export const Toolbar: React.FC<any> = ({
  currentWidth,
  currentColor,
  toggleFullscreen,
  handleDownload,
  dataUrl,
  handleClear,
  handleEraserMode,
  handleRegularMode,
  handleColor,
  handleWidth,
  isRegularMode,
  isAutoWidth,
  isEraser,
}) => {
  const styleAside = {
    position: 'absolute' as 'absolute',
    flexBasis: '196px',
    backgroundColor: '#f1f1f1',
    padding: '1.2em',
    display: 'flex',
    flexDirection: 'column' as 'column',
    overflow: 'auto'
  };

  return (
    <aside style={styleAside}>
      <div>
        <BrushPreview currentWidth={currentWidth} currentColor={currentColor} />
        <div className="tool-section tool-section--lrg">
          <div className="tool-section">
            <small>
              <strong>Brush color</strong>
            </small>
          </div>
          <input
            disabled={!isRegularMode}
            className="btn--color"
            type="color"
            id="toolColorPicker"
            onChange={handleColor}
          />
        </div>
        <div className="tool-section">
          <small>
            <strong>Tools</strong>
          </small>
        </div>
        <div className="tool-grid tool-section tool-section--lrg">
          <div>
            <button
              className={`btn btn--tool ${
                isRegularMode && !isEraser ? "btn--active" : ""
              }`}
              onClick={handleRegularMode}
            >
              <FontAwesomeIcon icon={faPaintBrush} />
            </button>
          </div>
          <div>
            <button
              className={`btn btn--tool ${
                isEraser ? "btn--eraser-active" : ""
              }`}
              onClick={handleEraserMode}
            >
              <FontAwesomeIcon icon={faEraser} />
            </button>
          </div>
        </div>
        {!isAutoWidth && (
          <div className="tool-section tool-section--lrg">
            <div className="tool-section">
              <small>
                <strong>Brush size</strong>
              </small>
            </div>
            <div className="tool-section">
              <input
                defaultValue="50"
                type="range"
                min="10"
                max="90"
                onChange={handleWidth}
              />
            </div>
          </div>
        )}
      </div>
      <div>
        <button onClick={handleDownload}>
          <FontAwesomeIcon icon={faSave} />
        </button>
        <button className="btn btn--block" onClick={handleClear}>
          Clear
        </button>
      </div>
      <div>
        <button onClick={toggleFullscreen}>
          <FontAwesomeIcon icon={faExpand} />
        </button>
      </div>
    </aside>
  );
};
