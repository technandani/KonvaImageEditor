import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Image, Text, Line, Transformer } from "react-konva";
import useImage from "use-image";

const DesignPage = () => {
  const [imageSrc, setImageSrc] = useState(null); // Uploaded image source
  const [tool, setTool] = useState("none"); // Current tool selection
  const [lines, setLines] = useState([]); // Freehand drawing
  const [textBoxes, setTextBoxes] = useState([]); // Text boxes
  const [selectedTextId, setSelectedTextId] = useState(null); // Selected text for editing
  const [isTransformerEnabled, setIsTransformerEnabled] = useState(false); // Transformer toggle
  const [isDraggable, setIsDraggable] = useState(true); // Toggle draggable state for image and text
  const [history, setHistory] = useState([
    { lines: [], textBoxes: [], imagePosition: { x: 100, y: 50 } },
  ]);
  const [historyStep, setHistoryStep] = useState(0); // Current step in history
  const stageRef = useRef(null); // Reference to Konva stage
  const transformerRef = useRef(null); // Reference to Transformer for resizing
  const [image] = useImage(imageSrc); // Load image using useImage hook
  const imageRef = useRef(null); // Reference for image node

  const isDrawing = useRef(false); // Track drawing state

  // Handle image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImageSrc(reader.result);
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (imageRef.current && image) {
      imageRef.current.getLayer().batchDraw();
    }
  }, [image]);

  useEffect(() => {
    if (transformerRef.current && isTransformerEnabled && imageRef.current) {
      transformerRef.current.nodes([imageRef.current]);
      transformerRef.current.getLayer().batchDraw();
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isTransformerEnabled]);

  const saveHistory = (updatedImagePosition = null) => {
    const newHistory = history.slice(0, historyStep + 1);
    const newEntry = {
      lines,
      textBoxes,
      imagePosition:
        updatedImagePosition ||
        (imageRef.current
          ? { x: imageRef.current.x(), y: imageRef.current.y() }
          : { x: 100, y: 50 }),
    };
    setHistory([...newHistory, newEntry]);
    setHistoryStep(newHistory.length);
  };

  // Undo functionality
  const handleUndo = () => {
    if (historyStep === 0) return;
    const previousStep = history[historyStep - 1];
    setLines(previousStep.lines);
    setTextBoxes(previousStep.textBoxes);
    if (imageRef.current && previousStep.imagePosition) {
      imageRef.current.position(previousStep.imagePosition);
      imageRef.current.getLayer().batchDraw();
    }
    setHistoryStep(historyStep - 1);
  };

  // Redo functionality
  const handleRedo = () => {
    if (historyStep === history.length - 1) return;
    const nextStep = history[historyStep + 1];
    setLines(nextStep.lines);
    setTextBoxes(nextStep.textBoxes);
    if (imageRef.current && nextStep.imagePosition) {
      imageRef.current.position(nextStep.imagePosition);
      imageRef.current.getLayer().batchDraw();
    }
    setHistoryStep(historyStep + 1);
  };

  // Handle mouse events for pencil tool
  const handleMouseDown = (e) => {
    if (tool !== "pencil") return;
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, { points: [pos.x, pos.y] }]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current || tool !== "pencil") return;
    const pos = e.target.getStage().getPointerPosition();
    const lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([pos.x, pos.y]);
    lines.splice(lines.length - 1, 1, lastLine);
    setLines([...lines]);
  };

  const handleMouseUp = () => {
    if (isDrawing.current) saveHistory();
    isDrawing.current = false;
  };

  // Add text box
  const addTextBox = () => {
    const newTextBox = {
      id: textBoxes.length,
      x: 350,
      y: 100,
      text: "Double-click to edit",
    };
    setTextBoxes([...textBoxes, newTextBox]);
    saveHistory();
  };

  // Handle text edit
  const handleTextEdit = (id) => {
    const text = textBoxes.find((box) => box.id === id);
    const newText = prompt("Edit text:", text.text);
    if (newText) {
      const updatedTextBoxes = textBoxes.map((box) =>
        box.id === id ? { ...box, text: newText } : box
      );
      setTextBoxes(updatedTextBoxes);
      saveHistory();
    }
  };

  // Save canvas as image
  const saveCanvas = () => {
    const uri = stageRef.current.toDataURL();
    const link = document.createElement("a");
    link.download = "design.png";
    link.href = uri;
    link.click();
  };

  // Toggle Transformer tool
  const toggleTransformer = () => {
    if (isTransformerEnabled) {
      setIsTransformerEnabled(false);
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
    } else {
      setIsTransformerEnabled(true);
    }
  };

  const handleImageDragEnd = (e) => {
    const updatedImagePosition = {
      x: e.target.x(),
      y: e.target.y(),
    };
    saveHistory(updatedImagePosition);
  };

  const handleTextBoxDragEnd = (id, e) => {
    const updatedTextBoxes = textBoxes.map((box) =>
      box.id === id
        ? {
            ...box,
            x: e.target.x(),
            y: e.target.y(),
          }
        : box
    );
    setTextBoxes(updatedTextBoxes);
    saveHistory();
  };

  const togglePencilTool = () => {
    if (tool === "pencil") {
      setTool("none");
      setIsDraggable(true);
    } else {
      setTool("pencil");
      setIsDraggable(false);
    }
  };

  return (
    <div>
      <h1>Design Page</h1>

      {/* Toolbar */}
      <div style={{ marginBottom: "10px", display: "flex", gap: "10px", justifyContent:'center', alignItems:'center' }}>
        <button onClick={handleUndo}>
          <img src="images/undo.png" style={{ height: "20px" }} alt="" />
        </button>
        <button onClick={handleRedo}>
          <img src="images/redo.png" style={{ height: "20px" }} alt="" />
        </button>
        <div onClick={togglePencilTool}>
          {tool === "pencil" ? (
            <button style={{backgroundColor:'#646cff'}}><img
            src="images/pencil.png"
            style={{ height: "20px", transform: "scale(1.5)" }}
            alt=""
          /></button>
          ) : (
            <button>
                 <img src="images/pencil.png" style={{ height: "20px" }} alt="" />
            </button>
          )}
        </div>
        <button className="file-input-container">
          <input
            type="file"
            accept="image/*"
            id="file-upload"
            className="file-input"
            onChange={handleImageUpload}
          />
          <label for="file-upload" className="file-label">
            Upload Image
          </label>
        </button>
        <button onClick={addTextBox}>Add Text</button>
        <div onClick={toggleTransformer}>
          {isTransformerEnabled ? <button style={{backgroundColor:'#646cff'}}>Disable Resize</button> : <button>Enable Resize</button>}
        </div>
        <button onClick={saveCanvas}>Download Design</button>
      </div>

      <Stage
        width={900}
        height={500}
        style={{ border: "1px solid #fff", backgroundColor: "#121212" }}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        ref={stageRef}
      >
        <Layer>
          {image && (
            <Image
              image={image}
              draggable={isDraggable}
              ref={imageRef}
              onDragEnd={handleImageDragEnd}
              x={history[historyStep]?.imagePosition?.x || 100}
              y={history[historyStep]?.imagePosition?.y || 50}
              width={Math.min(image.width, 700)}
              height={Math.min(image.height, 450)}
            />
          )}
          <Transformer ref={transformerRef} />
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke="red"
              strokeWidth={2}
              tension={0.5}
              lineCap="round"
            />
          ))}

          {/* Text Boxes */}
          {textBoxes.map((box) => (
            <Text
              key={box.id}
              text={box.text}
              x={box.x}
              y={box.y}
              draggable={isDraggable}
              fontSize={20}
              onDragEnd={(e) => handleTextBoxDragEnd(box.id, e)}
              onClick={() => setSelectedTextId(box.id)}
              onDblClick={() => handleTextEdit(box.id)}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default DesignPage;
