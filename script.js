document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const editorContainer = document.getElementById("editor-container");
  const editor = document.getElementById("editor");
  const imageLayer = document.getElementById("image-layer");
  const drawLayer = document.getElementById("draw-layer");
  const textLayer = document.getElementById("text-layer");
  const placeholder = document.getElementById("placeholder");
  const fileInput = document.getElementById("file-input");
  const drawBtn = document.getElementById("draw-btn");
  const eraseBtn = document.getElementById("erase-btn");
  const textBtn = document.getElementById("text-btn");
  const colorPicker = document.getElementById("color-picker");
  const brushSize = document.getElementById("brush-size");
  const brushSizeValue = document.getElementById("brush-size-value");
  const zoomInBtn = document.getElementById("zoom-in-btn");
  const zoomOutBtn = document.getElementById("zoom-out-btn");
  const zoomSlider = document.getElementById("zoom-slider");
  const zoomValue = document.getElementById("zoom-value");
  const downloadBtn = document.getElementById("download-btn");
  const panBtn = document.getElementById("pan-btn");

  // Variables
  let currentTool = "draw";
  let isDrawing = false;
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let hasImage = false;

  // Event listeners
  fileInput.addEventListener("change", handleImageUpload);
  drawBtn.addEventListener("click", () => setTool("draw"));
  eraseBtn.addEventListener("click", () => setTool("erase"));
  textBtn.addEventListener("click", addTextOverlay);
  colorPicker.addEventListener("input", updateBrushColor);
  brushSize.addEventListener("input", updateBrushSize);
  zoomInBtn.addEventListener("click", zoomIn);
  zoomOutBtn.addEventListener("click", zoomOut);
  zoomSlider.addEventListener("input", handleZoomSlider);
  downloadBtn.addEventListener("click", downloadImage);
  panBtn.addEventListener("click", () => setTool("pan"));

  // Editor event listeners
  editor.addEventListener("mousedown", startDrawing);
  editor.addEventListener("mousemove", draw);
  editor.addEventListener("mouseup", stopDrawing);
  editor.addEventListener("mouseleave", stopDrawing);
  editorContainer.addEventListener("wheel", handleWheel);

  // Drag functionality
  editorContainer.addEventListener("mousedown", startDrag);
  editorContainer.addEventListener("mousemove", drag);
  editorContainer.addEventListener("mouseup", stopDrag);
  editorContainer.addEventListener("mouseleave", stopDrag);

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      imageLayer.style.backgroundImage = `url(${event.target.result})`;
      hasImage = true;
      placeholder.style.display = "none";
      resetView();
    };
    reader.readAsDataURL(file);
  }

  function resetView() {
    scale = 1;
    offsetX = 0;
    offsetY = 0;
    updateEditorTransform();
    zoomSlider.value = 100;
    zoomValue.textContent = "100%";
  }

  function updateEditorTransform() {
    editor.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
  }

  function setTool(tool) {
    currentTool = tool;
    drawBtn.classList.toggle("active", tool === "draw");
    eraseBtn.classList.toggle("active", tool === "erase");
    panBtn.classList.toggle("active", tool === "pan");

    if (tool === "draw" || tool === "erase") {
      editor.style.cursor = "crosshair";
    } else if (tool === "pan") {
      editor.style.cursor = "grab";
    }
  }

  function updateBrushColor() {
    // Color is automatically updated via the input
  }

  function updateBrushSize() {
    brushSizeValue.textContent = brushSize.value;
  }

  function startDrawing(e) {
    if (!hasImage || currentTool === "pan") return;

    isDrawing = true;
    draw(e);
  }

  function draw(e) {
    if (!isDrawing || !hasImage || currentTool === "pan") return;

    const rect = editor.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", brushSize.value / (2 * scale));
    circle.setAttribute(
      "fill",
      currentTool === "draw" ? colorPicker.value : "#ffffff"
    );

    drawLayer.appendChild(circle);
  }

  function stopDrawing() {
    isDrawing = false;
  }

  function zoomIn() {
    if (!hasImage) return;
    scale = Math.min(scale * 1.2, 4);
    updateZoomUI();
    updateEditorTransform();
  }

  function zoomOut() {
    if (!hasImage) return;
    scale = Math.max(scale / 1.2, 0.1);
    updateZoomUI();
    updateEditorTransform();
  }

  function handleZoomSlider() {
    if (!hasImage) return;
    scale = Number.parseInt(zoomSlider.value) / 100;
    updateZoomUI(false);
    updateEditorTransform();
  }

  function updateZoomUI(updateSlider = true) {
    if (updateSlider) {
      zoomSlider.value = Math.round(scale * 100);
    }
    zoomValue.textContent = Math.round(scale * 100) + "%";
  }

  function handleWheel(e) {
    if (!hasImage) return;

    e.preventDefault();

    if (e.ctrlKey) {
      // Zooming
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const mouseX = e.clientX - editorContainer.offsetLeft;
      const mouseY = e.clientY - editorContainer.offsetTop;

      const oldScale = scale;
      scale = Math.min(Math.max(scale * zoomFactor, 0.1), 4);

      // Adjust offset to zoom towards mouse position
      offsetX += mouseX * (1 - scale / oldScale);
      offsetY += mouseY * (1 - scale / oldScale);

      updateZoomUI();
      updateEditorTransform();
    } else if (e.shiftKey) {
      // Horizontal scrolling
      offsetX -= e.deltaY;
      updateEditorTransform();
    } else {
      // Vertical scrolling
      offsetY -= e.deltaY;
      updateEditorTransform();
    }
  }

  function startDrag(e) {
    if (!hasImage || (isDrawing && currentTool !== "pan")) return;

    isDragging = true;
    dragStartX = e.clientX - offsetX;
    dragStartY = e.clientY - offsetY;
    editor.style.cursor = "grabbing";
  }

  function drag(e) {
    if (!isDragging || !hasImage) return;

    offsetX = e.clientX - dragStartX;
    offsetY = e.clientY - dragStartY;
    updateEditorTransform();
  }

  function stopDrag() {
    if (isDragging) {
      isDragging = false;
      editor.style.cursor = currentTool === "pan" ? "grab" : "default";
    }
  }

  function addTextOverlay() {
    if (!hasImage) return;

    const textElement = document.createElement("div");
    textElement.className = "text-overlay";
    textElement.contentEditable = true;
    textElement.textContent = "Edit this text";
    textElement.style.left = "50%";
    textElement.style.top = "50%";
    textElement.style.transform = "translate(-50%, -50%)";
    textElement.style.color = colorPicker.value;
    textElement.style.fontSize = brushSize.value + "px";

    textLayer.appendChild(textElement);

    let isTextDragging = false;
    let textStartX, textStartY;

    textElement.addEventListener("mousedown", (e) => {
      if (currentTool !== "pan") {
        isTextDragging = true;
        textStartX = e.clientX - textElement.offsetLeft;
        textStartY = e.clientY - textElement.offsetTop;
        e.stopPropagation();
      }
    });

    document.addEventListener("mousemove", (e) => {
      if (isTextDragging) {
        textElement.style.left = e.clientX - textStartX + "px";
        textElement.style.top = e.clientY - textStartY + "px";
      }
    });

    document.addEventListener("mouseup", () => {
      isTextDragging = false;
    });

    textElement.addEventListener("input", () => {
      textElement.style.color = colorPicker.value;
      textElement.style.fontSize = brushSize.value + "px";
    });
  }

  function downloadImage() {
    if (!hasImage) return;

    // Create a new SVG element
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const editorRect = editor.getBoundingClientRect();
    svg.setAttribute("width", editorRect.width);
    svg.setAttribute("height", editorRect.height);

    // Add the background image
    const image = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "image"
    );
    image.setAttributeNS(
      "http://www.w3.org/1999/xlink",
      "href",
      imageLayer.style.backgroundImage.slice(5, -2)
    );
    image.setAttribute("width", "100%");
    image.setAttribute("height", "100%");
    svg.appendChild(image);

    // Add the drawings
    const drawingSvg = drawLayer.cloneNode(true);
    svg.appendChild(drawingSvg);

    // Add the text overlays
    const textOverlays = textLayer.querySelectorAll(".text-overlay");
    textOverlays.forEach((overlay) => {
      const foreignObject = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "foreignObject"
      );
      foreignObject.setAttribute("x", overlay.style.left);
      foreignObject.setAttribute("y", overlay.style.top);
      foreignObject.setAttribute("width", overlay.offsetWidth);
      foreignObject.setAttribute("height", overlay.offsetHeight);

      const overlayClone = overlay.cloneNode(true);
      overlayClone.style.left = "";
      overlayClone.style.top = "";
      overlayClone.style.transform = "";
      foreignObject.appendChild(overlayClone);

      svg.appendChild(foreignObject);
    });

    // Convert SVG to a data URL
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);

    // Create a temporary image to convert SVG to PNG
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = editorRect.width;
      canvas.height = editorRect.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      // Create download link
      const link = document.createElement("a");
      link.download = "edited-image.png";
      link.href = canvas.toDataURL("image/png");
      link.click();

      // Clean up
      URL.revokeObjectURL(svgUrl);
    };
    img.src = svgUrl;
  }
});
