const IMAGE_WIDTH = 2048;
const IMAGE_HEIGHT = 2048;

const viewport = document.querySelector("#mapViewport");
const content = document.querySelector("#mapContent");
const markerLayer = document.querySelector("#markerLayer");
const markerList = document.querySelector("#markerList");
const searchInput = document.querySelector("#searchInput");
const zoomInButton = document.querySelector("#zoomIn");
const zoomOutButton = document.querySelector("#zoomOut");
const resetButton = document.querySelector("#resetMap");

let scale = 1;
let offsetX = 0;
let offsetY = 0;
let activePopup = null;
let activeMarkerButton = null;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let startOffsetX = 0;
let startOffsetY = 0;

const markerButtons = new Map();

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function applyTransform() {
  content.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}

function clampOffsets() {
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  const scaledWidth = IMAGE_WIDTH * scale;
  const scaledHeight = IMAGE_HEIGHT * scale;

  if (scaledWidth <= vw) {
    offsetX = (vw - scaledWidth) / 2;
  } else {
    offsetX = Math.min(0, Math.max(vw - scaledWidth, offsetX));
  }

  if (scaledHeight <= vh) {
    offsetY = (vh - scaledHeight) / 2;
  } else {
    offsetY = Math.min(0, Math.max(vh - scaledHeight, offsetY));
  }
}

function resetMap() {
  const scaleX = viewport.clientWidth / IMAGE_WIDTH;
  const scaleY = viewport.clientHeight / IMAGE_HEIGHT;
  scale = Math.min(scaleX, scaleY);
  offsetX = (viewport.clientWidth - IMAGE_WIDTH * scale) / 2;
  offsetY = (viewport.clientHeight - IMAGE_HEIGHT * scale) / 2;
  applyTransform();
}

function zoomAt(clientX, clientY, factor) {
  const oldScale = scale;
  const nextScale = Math.min(3, Math.max(0.15, scale * factor));
  const rect = viewport.getBoundingClientRect();
  const mouseX = clientX - rect.left;
  const mouseY = clientY - rect.top;

  const imageX = (mouseX - offsetX) / oldScale;
  const imageY = (mouseY - offsetY) / oldScale;

  scale = nextScale;
  offsetX = mouseX - imageX * scale;
  offsetY = mouseY - imageY * scale;

  clampOffsets();
  applyTransform();
}

function focusMarker(marker) {
  scale = Math.max(scale, 0.75);
  offsetX = viewport.clientWidth / 2 - marker.x * scale;
  offsetY = viewport.clientHeight / 2 - marker.y * scale;
  clampOffsets();
  applyTransform();
  showPopup(marker);
}

function showPopup(marker) {
  closePopup();

  const button = markerButtons.get(marker.id);
  button.classList.add("active");
  activeMarkerButton = button;

  const popup = document.createElement("div");
  popup.className = "popup";
  popup.style.left = `${marker.x}px`;
  popup.style.top = `${marker.y}px`;
  popup.innerHTML = `
    <button type="button" aria-label="Sluiten">×</button>
    <h3>${escapeHtml(marker.title)}</h3>
    <span class="type">${escapeHtml(marker.type || "Marker")}</span>
    <p>${escapeHtml(marker.description || "")}</p>
  `;
  popup.querySelector("button").addEventListener("click", closePopup);
  markerLayer.appendChild(popup);
  activePopup = popup;
}

function closePopup() {
  if (activePopup) activePopup.remove();
  if (activeMarkerButton) activeMarkerButton.classList.remove("active");
  activePopup = null;
  activeMarkerButton = null;
}

function renderMarkers(filter = "") {
  markerLayer.querySelectorAll(".map-marker").forEach((marker) => marker.remove());
  markerList.innerHTML = "";
  markerButtons.clear();
  closePopup();

  const normalizedFilter = filter.trim().toLowerCase();

  MAP_MARKERS.forEach((marker) => {
    const text = `${marker.title} ${marker.type || ""} ${marker.description || ""}`.toLowerCase();
    if (normalizedFilter && !text.includes(normalizedFilter)) return;

    const markerButton = document.createElement("button");
    markerButton.className = "map-marker";
    markerButton.type = "button";
    markerButton.title = marker.title;
    markerButton.style.left = `${marker.x}px`;
    markerButton.style.top = `${marker.y}px`;
    markerButton.addEventListener("click", (event) => {
      event.stopPropagation();
      showPopup(marker);
    });
    markerLayer.appendChild(markerButton);
    markerButtons.set(marker.id, markerButton);

    const card = document.createElement("button");
    card.className = "marker-card";
    card.type = "button";
    card.innerHTML = `<strong>${escapeHtml(marker.title)}</strong><span>${escapeHtml(marker.type || "Marker")}</span>`;
    card.addEventListener("click", () => focusMarker(marker));
    markerList.appendChild(card);
  });
}

function viewportToImage(clientX, clientY) {
  const rect = viewport.getBoundingClientRect();
  const x = Math.round((clientX - rect.left - offsetX) / scale);
  const y = Math.round((clientY - rect.top - offsetY) / scale);
  return {
    x: Math.max(0, Math.min(IMAGE_WIDTH, x)),
    y: Math.max(0, Math.min(IMAGE_HEIGHT, y))
  };
}

viewport.addEventListener("mousedown", (event) => {
  isDragging = true;
  viewport.classList.add("dragging");
  dragStartX = event.clientX;
  dragStartY = event.clientY;
  startOffsetX = offsetX;
  startOffsetY = offsetY;
});

window.addEventListener("mousemove", (event) => {
  if (!isDragging) return;
  offsetX = startOffsetX + event.clientX - dragStartX;
  offsetY = startOffsetY + event.clientY - dragStartY;
  clampOffsets();
  applyTransform();
});

window.addEventListener("mouseup", () => {
  isDragging = false;
  viewport.classList.remove("dragging");
});

viewport.addEventListener("wheel", (event) => {
  event.preventDefault();
  zoomAt(event.clientX, event.clientY, event.deltaY < 0 ? 1.15 : 0.87);
}, { passive: false });

viewport.addEventListener("click", (event) => {
  if (event.target.closest(".map-marker") || event.target.closest(".popup")) return;
  const position = viewportToImage(event.clientX, event.clientY);
  const text = `x: ${position.x}, y: ${position.y}`;
  console.log(`Marker positie: ${text}`);
  alert(`Marker positie:\n${text}`);
  closePopup();
});

zoomInButton.addEventListener("click", () => zoomAt(viewport.clientWidth / 2, viewport.clientHeight / 2, 1.25));
zoomOutButton.addEventListener("click", () => zoomAt(viewport.clientWidth / 2, viewport.clientHeight / 2, 0.8));
resetButton.addEventListener("click", resetMap);
searchInput.addEventListener("input", (event) => renderMarkers(event.target.value));
window.addEventListener("resize", resetMap);

renderMarkers();
resetMap();
