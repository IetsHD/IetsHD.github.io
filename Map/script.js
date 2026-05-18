const IMAGE_WIDTH = 2048;
const IMAGE_HEIGHT = 2048;
const IMAGE_URL = "map.png";

const bounds = [[0, 0], [IMAGE_HEIGHT, IMAGE_WIDTH]];

const map = L.map("map", {
  crs: L.CRS.Simple,
  minZoom: -2,
  maxZoom: 2,
  zoomSnap: 0.25,
  attributionControl: false
});

L.imageOverlay(IMAGE_URL, bounds).addTo(map);
map.fitBounds(bounds);
map.setMaxBounds(bounds);

const markerIcon = L.divIcon({
  className: "custom-marker",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16]
});

const leafletMarkers = new Map();
const markerList = document.querySelector("#markerList");
const searchInput = document.querySelector("#searchInput");

function xyToLatLng(x, y) {
  // Leaflet gebruikt y=0 onderaan, terwijl pixelcoördinaten y=0 bovenaan starten.
  return [IMAGE_HEIGHT - y, x];
}

function markerPopup(marker) {
  return `
    <h3 class="popup-title">${escapeHtml(marker.title)}</h3>
    <span class="popup-type">${escapeHtml(marker.type || "Marker")}</span>
    <p class="popup-description">${escapeHtml(marker.description || "")}</p>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderMarkers(filter = "") {
  markerList.innerHTML = "";
  const normalizedFilter = filter.trim().toLowerCase();

  MAP_MARKERS.forEach((marker) => {
    const text = `${marker.title} ${marker.type} ${marker.description}`.toLowerCase();
    const isVisible = !normalizedFilter || text.includes(normalizedFilter);

    const leafletMarker = leafletMarkers.get(marker.id);
    if (leafletMarker) {
      if (isVisible && !map.hasLayer(leafletMarker)) leafletMarker.addTo(map);
      if (!isVisible && map.hasLayer(leafletMarker)) leafletMarker.remove();
    }

    if (!isVisible) return;

    const button = document.createElement("button");
    button.className = "marker-card";
    button.type = "button";
    button.innerHTML = `<strong>${escapeHtml(marker.title)}</strong><span>${escapeHtml(marker.type || "Marker")}</span>`;
    button.addEventListener("click", () => {
      const activeMarker = leafletMarkers.get(marker.id);
      map.setView(xyToLatLng(marker.x, marker.y), 0.5);
      activeMarker.openPopup();
    });
    markerList.appendChild(button);
  });
}

MAP_MARKERS.forEach((marker) => {
  const leafletMarker = L.marker(xyToLatLng(marker.x, marker.y), { icon: markerIcon })
    .bindPopup(markerPopup(marker))
    .addTo(map);
  leafletMarkers.set(marker.id, leafletMarker);
});

searchInput.addEventListener("input", (event) => {
  renderMarkers(event.target.value);
});

// Klik op de map om pixelcoördinaten voor nieuwe markers te vinden.
map.on("click", (event) => {
  const x = Math.round(event.latlng.lng);
  const y = Math.round(IMAGE_HEIGHT - event.latlng.lat);

  console.log(`Marker positie: x: ${x}, y: ${y}`);
});

renderMarkers();
