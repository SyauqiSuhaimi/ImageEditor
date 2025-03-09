document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const canvasContainer = document.getElementById("canvas-container");
  const placeholder = document.getElementById("placeholder");
  const fileInput = document.getElementById("file-input");
  const drawBtn = document.getElementById("draw-btn");
  const eraseBtn = document.getElementById("erase-btn");
  const colorPicker = document.getElementById("color-picker");
  const brushSize = document.getElementById("brush-size");
  const brushSizeValue = document.getElementById("brush-size-value");
  const zoomInBtn = document.getElementById("zoom-in-btn");
  const zoomOutBtn = document.getElementById("zoom-out-btn");
  const zoomSlider = document.getElementById("zoom-slider");
  const zoomValue = document.getElementById("zoom-value");
  const downloadBtn = document.getElementById("download-btn");
  const panBtn = document.getElementById("pan-btn");
  const textBtn = document.getElementById("text-btn");
  const textOverlayContainer = document.getElementById(
    "text-overlay-container"
  );

  // Variables
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;
  let currentTool = "draw";
  let originalImage = null;
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let hasImage = false;

  // Initialize
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // Set initial state
  drawBtn.classList.add("active");

  // Event listeners
  fileInput.addEventListener("change", handleImageUpload);
  drawBtn.addEventListener("click", () => setTool("draw"));
  eraseBtn.addEventListener("click", () => setTool("erase"));
  colorPicker.addEventListener("input", updateBrushColor);
  brushSize.addEventListener("input", updateBrushSize);
  zoomInBtn.addEventListener("click", zoomIn);
  zoomOutBtn.addEventListener("click", zoomOut);
  zoomSlider.addEventListener("input", handleZoomSlider);
  downloadBtn.addEventListener("click", downloadImage);
  panBtn.addEventListener("click", () => setTool("pan"));
  textBtn.addEventListener("click", addTextOverlay);

  // Canvas event listeners
  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stopDrawing);
  canvas.addEventListener("mouseout", stopDrawing);
  canvas.addEventListener("wheel", handleWheel);

  // Drag functionality
  canvasContainer.addEventListener("mousedown", startDrag);
  canvasContainer.addEventListener("mousemove", drag);
  canvasContainer.addEventListener("mouseup", stopDrag);
  canvasContainer.addEventListener("mouseleave", stopDrag);

  // Functions
  function resizeCanvas() {
    canvas.width = canvasContainer.clientWidth;
    canvas.height = canvasContainer.clientHeight;
    redrawCanvas();
  }

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        originalImage = img;
        hasImage = true;
        placeholder.style.display = "none";
        canvas.style.display = "block";
        resetView();
        redrawCanvas();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  function resetView() {
    scale = 1;
    offsetX = (canvas.width - originalImage.width) / 2;
    offsetY = (canvas.height - originalImage.height) / 2;
    zoomSlider.value = 100;
    zoomValue.textContent = "100%";
  }

  function redrawCanvas() {
    if (hasImage) {
      adjustOffsets(); // Only call adjustOffsets when there's an image
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (hasImage) {
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);
      ctx.drawImage(originalImage, 0, 0);
      ctx.restore();
    }
  }

  function setTool(tool) {
    currentTool = tool;
    drawBtn.classList.toggle("active", tool === "draw");
    eraseBtn.classList.toggle("active", tool === "erase");
    panBtn.classList.toggle("active", tool === "pan");

    if (tool === "draw") {
      canvas.style.cursor = "crosshair";
      canvasContainer.style.cursor = "default";
    } else if (tool === "erase") {
      canvas.style.cursor = "cell";
      canvasContainer.style.cursor = "default";
    } else if (tool === "pan") {
      canvas.style.cursor = "grab";
      canvasContainer.style.cursor = "grab";
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
    const rect = canvas.getBoundingClientRect();
    lastX = (e.clientX - rect.left - offsetX) / scale;
    lastY = (e.clientY - rect.top - offsetY) / scale;
  }

  function draw(e) {
    if (!isDrawing || !hasImage) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = (e.clientX - rect.left - offsetX) / scale;
    const currentY = (e.clientY - rect.top - offsetY) / scale;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = brushSize.value / scale;

    if (currentTool === "draw") {
      ctx.strokeStyle = colorPicker.value;
      ctx.globalCompositeOperation = "source-over";
    } else if (currentTool === "erase") {
      ctx.strokeStyle = "#ffffff";
      ctx.globalCompositeOperation = "destination-out";
    }

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    ctx.restore();

    lastX = currentX;
    lastY = currentY;
  }

  function stopDrawing() {
    isDrawing = false;
  }

  function zoomIn() {
    if (!hasImage) return;
    scale = Math.min(scale * 1.2, 4);
    updateZoomUI();
    redrawCanvas();
  }

  function zoomOut() {
    if (!hasImage) return;
    scale = Math.max(scale / 1.2, 0.1);
    updateZoomUI();
    redrawCanvas();
  }

  function handleZoomSlider() {
    if (!hasImage) return;
    scale = Number.parseInt(zoomSlider.value) / 100;
    updateZoomUI(false);
    redrawCanvas();
  }

  function updateZoomUI(updateSlider = true) {
    if (updateSlider) {
      zoomSlider.value = Math.round(scale * 100);
    }
    zoomValue.textContent = Math.round(scale * 100) + "%";
  }

  function handleWheel(e) {
    if (!hasImage) return;

    e.preventDefault(); // Prevent default scrolling

    if (e.ctrlKey) {
      // Zooming
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const mouseX = e.clientX - canvas.offsetLeft;
      const mouseY = e.clientY - canvas.offsetTop;

      const oldScale = scale;
      scale = Math.min(Math.max(scale * zoomFactor, 0.1), 4);

      // Adjust offset to zoom towards mouse position
      offsetX = mouseX - (mouseX - offsetX) * (scale / oldScale);
      offsetY = mouseY - (mouseY - offsetY) * (scale / oldScale);

      updateZoomUI();
    } else if (e.shiftKey) {
      // Horizontal scrolling
      offsetX -= e.deltaY;
    } else {
      // Vertical scrolling
      offsetY -= e.deltaY;
    }

    redrawCanvas();
  }

  function startDrag(e) {
    if (!hasImage || (isDrawing && currentTool !== "pan")) return;

    // Only allow dragging when in pan mode or when dragging outside the canvas
    if (currentTool === "pan" || e.target !== canvas) {
      isDragging = true;
      dragStartX = e.clientX - offsetX;
      dragStartY = e.clientY - offsetY;

      if (currentTool === "pan") {
        canvas.style.cursor = "grabbing";
      }
      canvasContainer.style.cursor = "grabbing";
    }
  }

  function drag(e) {
    if (!isDragging || !hasImage) return;

    const newOffsetX = e.clientX - dragStartX;
    const newOffsetY = e.clientY - dragStartY;

    const canvasRect = canvas.getBoundingClientRect();
    const scaledWidth = originalImage.width * scale;
    const scaledHeight = originalImage.height * scale;

    // Allow dragging only when image is larger than canvas
    if (scaledWidth > canvasRect.width) {
      offsetX = Math.min(
        0,
        Math.max(canvasRect.width - scaledWidth, newOffsetX)
      );
    }
    if (scaledHeight > canvasRect.height) {
      offsetY = Math.min(
        0,
        Math.max(canvasRect.height - scaledHeight, newOffsetY)
      );
    }

    redrawCanvas();
  }

  function stopDrag() {
    if (isDragging) {
      isDragging = false;

      if (currentTool === "pan") {
        canvas.style.cursor = "grab";
      }
      canvasContainer.style.cursor = currentTool === "pan" ? "grab" : "default";
    }
  }

  function downloadImage() {
    if (!hasImage) return;

    // Create a temporary canvas to render the final image
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = originalImage.width;
    tempCanvas.height = originalImage.height;
    const tempCtx = tempCanvas.getContext("2d");

    // Draw the original image
    tempCtx.drawImage(originalImage, 0, 0);

    // Draw the edits from our main canvas
    tempCtx.drawImage(
      canvas,
      offsetX,
      offsetY,
      originalImage.width * scale,
      originalImage.height * scale,
      0,
      0,
      originalImage.width,
      originalImage.height
    );

    // Draw text overlays
    const textOverlays = document.querySelectorAll(".text-overlay");
    textOverlays.forEach((overlay) => {
      const rect = overlay.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();

      tempCtx.font = window.getComputedStyle(overlay).font;
      tempCtx.fillStyle = window.getComputedStyle(overlay).color;
      tempCtx.fillText(
        overlay.textContent,
        (rect.left - canvasRect.left - offsetX) / scale,
        (rect.top - canvasRect.top - offsetY) / scale +
          Number.parseInt(window.getComputedStyle(overlay).fontSize)
      );
    });

    // Create download link
    const link = document.createElement("a");
    link.download = "edited-image.png";
    link.href = tempCanvas.toDataURL("image/png");
    link.click();
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

    textOverlayContainer.appendChild(textElement);

    let isDragging = false;
    let startX, startY;

    textElement.addEventListener("mousedown", (e) => {
      if (currentTool !== "pan") {
        isDragging = true;
        startX = e.clientX - textElement.offsetLeft;
        startY = e.clientY - textElement.offsetTop;
        e.preventDefault();
      }
    });

    document.addEventListener("mousemove", (e) => {
      if (isDragging) {
        textElement.style.left = e.clientX - startX + "px";
        textElement.style.top = e.clientY - startY + "px";
      }
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
    });

    textElement.addEventListener("input", () => {
      textElement.style.color = colorPicker.value;
      textElement.style.fontSize = brushSize.value + "px";
    });
  }

  function adjustOffsets() {
    if (!hasImage || !originalImage) return; // Add this check

    const canvasRect = canvas.getBoundingClientRect();
    const scaledWidth = originalImage.width * scale;
    const scaledHeight = originalImage.height * scale;

    // Adjust horizontal offset
    if (scaledWidth <= canvasRect.width) {
      offsetX = (canvasRect.width - scaledWidth) / 2;
    } else {
      offsetX = Math.min(0, Math.max(canvasRect.width - scaledWidth, offsetX));
    }

    // Adjust vertical offset
    if (scaledHeight <= canvasRect.height) {
      offsetY = (canvasRect.height - scaledHeight) / 2;
    } else {
      offsetY = Math.min(
        0,
        Math.max(canvasRect.height - scaledHeight, offsetY)
      );
    }
  }
});
