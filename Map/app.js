const IMAGE_URL = "map.png";
const MARKERS_URL = "markers.json";

const DEFAULT_MARKER_COLOR = "#e74c3c";
const DEFAULT_COLOR_MARKER_SIZE = [30, 42];
const DEFAULT_CUSTOM_ICON_SIZE = [36, 36];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function loadImageSize(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error(`Kan afbeelding niet laden: ${src}`));
    img.src = src;
  });
}

function normalizeIconSize(value) {
  if (
    Array.isArray(value) &&
    value.length === 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  ) {
    return value;
  }

  return DEFAULT_CUSTOM_ICON_SIZE;
}

function getMarkerColor(marker) {
  const rawColor = typeof marker.color === "string"
    ? marker.color
    : typeof marker.markerColor === "string"
      ? marker.markerColor
      : DEFAULT_MARKER_COLOR;

  const color = rawColor.trim();

  // Voorkomt dat onveilige tekst in het style-attribuut terechtkomt.
  const hasUnsafeCharacters = /[;"'<>\\]/.test(color);

  if (
    color &&
    !hasUnsafeCharacters &&
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("color", color)
  ) {
    return color;
  }

  return DEFAULT_MARKER_COLOR;
}

function createColoredMarkerIcon(marker) {
  const color = getMarkerColor(marker);

  return L.divIcon({
    className: "colored-map-icon",
    html: `<span class="map-pin" style="--marker-color: ${color};"></span>`,
    iconSize: DEFAULT_COLOR_MARKER_SIZE,
    iconAnchor: [DEFAULT_COLOR_MARKER_SIZE[0] / 2, DEFAULT_COLOR_MARKER_SIZE[1]],
    popupAnchor: [0, -DEFAULT_COLOR_MARKER_SIZE[1]]
  });
}

function createImageMarkerIcon(marker) {
  const iconSize = normalizeIconSize(marker.iconSize);
  const iconAnchor = Array.isArray(marker.iconAnchor)
    ? marker.iconAnchor
    : [iconSize[0] / 2, iconSize[1]];
  const popupAnchor = Array.isArray(marker.popupAnchor)
    ? marker.popupAnchor
    : [0, -iconSize[1]];

  return L.icon({
    iconUrl: marker.icon,
    iconSize,
    iconAnchor,
    popupAnchor,
    className: marker.iconClass || "custom-map-icon"
  });
}

function createMarkerIcon(marker) {
  // Optioneel: als je toch een eigen icon-afbeelding gebruikt, krijgt die voorrang.
  if (marker.icon && typeof marker.icon === "string") {
    return createImageMarkerIcon(marker);
  }

  return createColoredMarkerIcon(marker);
}

async function loadMarkers() {
  const response = await fetch(MARKERS_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Kan ${MARKERS_URL} niet laden`);
  }
  const markers = await response.json();

  if (!Array.isArray(markers)) {
    throw new Error(`${MARKERS_URL} moet een array met markers bevatten`);
  }

  return markers.filter((marker) =>
    marker && typeof marker.name === "string" && Number.isFinite(marker.x) && Number.isFinite(marker.y)
  );
}

function createPopupHtml(marker) {
  const description = marker.description
    ? `<p>${escapeHtml(marker.description)}</p>`
    : "";

  const icon = marker.icon
    ? `<div class="popup-meta">Icon: ${escapeHtml(marker.icon)}</div>`
    : "";

  const color = getMarkerColor(marker);

  return `
    <strong class="popup-title">${escapeHtml(marker.name)}</strong>
    ${description}
    ${icon}
    <div class="popup-meta">Kleur: ${escapeHtml(color)}</div>
    <div class="popup-meta">x: ${Math.round(marker.x)}, y: ${Math.round(marker.y)}</div>
  `;
}

function createMarkerListButton(marker, onClick) {
  const button = document.createElement("button");
  button.className = "marker-button";
  button.type = "button";
  button.addEventListener("click", onClick);

  if (marker.icon) {
    const img = document.createElement("img");
    img.className = "marker-button-icon";
    img.src = marker.icon;
    img.alt = "";
    img.loading = "lazy";
    button.appendChild(img);
  } else {
    const colorDot = document.createElement("span");
    colorDot.className = "marker-color-dot";
    colorDot.style.setProperty("--marker-color", getMarkerColor(marker));
    button.appendChild(colorDot);
  }

  const label = document.createElement("span");
  label.textContent = marker.name;
  button.appendChild(label);

  return button;
}

async function initMap() {
  const status = document.getElementById("status");
  const markerList = document.getElementById("markerList");

  try {
    const { width, height } = await loadImageSize(IMAGE_URL);

    const map = L.map("map", {
      crs: L.CRS.Simple,
      minZoom: -3,
      maxZoom: 3,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 90
    });

    const bounds = [[0, 0], [height, width]];
    L.imageOverlay(IMAGE_URL, bounds).addTo(map);
    map.fitBounds(bounds);
    map.setMaxBounds(bounds);

    // markers.json gebruikt x/y-pixels vanaf linksboven.
    // Leaflet CRS.Simple gebruikt lat/lng, daarom draaien we y om.
    const toLatLng = (x, y) => [height - y, x];
    const toXY = (latlng) => ({
      x: Math.round(latlng.lng),
      y: Math.round(height - latlng.lat)
    });

    const markerLayer = L.layerGroup().addTo(map);
    const markers = await loadMarkers();

    markers.forEach((marker) => {
      const leafletMarker = L.marker(toLatLng(marker.x, marker.y), {
        title: marker.name,
        icon: createMarkerIcon(marker)
      })
        .addTo(markerLayer)
        .bindPopup(createPopupHtml(marker));

      const button = createMarkerListButton(marker, () => {
        map.setView(toLatLng(marker.x, marker.y), Math.max(map.getZoom(), 0.5));
        leafletMarker.openPopup();
      });
      markerList.appendChild(button);
    });

    status.textContent = `${markers.length} marker(s) geladen.`;

    map.on("click", async (event) => {
      const { x, y } = toXY(event.latlng);
      const snippet = `{
  "name": "Nieuwe marker",
  "x": ${x},
  "y": ${y},
  "description": "",
  "color": "#e74c3c"
}`;

      try {
        await navigator.clipboard.writeText(snippet);
      } catch (_) {
        // Clipboard werkt niet altijd, bijvoorbeeld zonder HTTPS. De snippet blijft zichtbaar in de popup.
      }

      L.popup()
        .setLatLng(event.latlng)
        .setContent(`
          <strong class="popup-title">Coördinaten</strong>
          <div>x: ${x}, y: ${y}</div>
          <div class="popup-meta">Plak dit object in markers.json:</div>
          <pre class="coord-snippet">${escapeHtml(snippet)}</pre>
        `)
        .openOn(map);
    });
  } catch (error) {
    status.textContent = error.message;
    console.error(error);
  }
}

initMap();
