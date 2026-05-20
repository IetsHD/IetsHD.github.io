const IMAGE_URL = "map.png";
const MARKERS_URL = "markers.json";

const DEFAULT_MARKER_COLOR = "#e74c3c";
const DEFAULT_COLOR_MARKER_SIZE = [30, 42];
const DEFAULT_CUSTOM_ICON_SIZE = [36, 36];
const VISIBILITY_STORAGE_PREFIX = "interactieve-kaart-marker-zichtbaar:";

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

function isMarkerVisibleByDefault(marker) {
  // Je kunt in markers.json bijvoorbeeld "visible": false of "hidden": true gebruiken.
  if (marker.visible === false || marker.hidden === true) {
    return false;
  }

  return true;
}

function getMarkerKey(marker, index) {
  if (typeof marker.id === "string" && marker.id.trim()) {
    return marker.id.trim();
  }

  return `${marker.name}:${Math.round(marker.x)}:${Math.round(marker.y)}:${index}`;
}

function readStoredVisibility(key, fallback) {
  try {
    const stored = localStorage.getItem(VISIBILITY_STORAGE_PREFIX + key);
    if (stored === "true") return true;
    if (stored === "false") return false;
  } catch (_) {
    // localStorage kan uitstaan. Dan gebruiken we de waarde uit markers.json.
  }

  return fallback;
}

function writeStoredVisibility(key, visible) {
  try {
    localStorage.setItem(VISIBILITY_STORAGE_PREFIX + key, String(Boolean(visible)));
  } catch (_) {
    // Geen probleem: de filter werkt nog steeds, alleen zonder onthouden na refresh.
  }
}

function createMarkerListItem(marker, initialVisible, onVisibilityChange, onFocus) {
  const item = document.createElement("div");
  item.className = "marker-item";

  const label = document.createElement("label");
  label.className = "marker-toggle";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = initialVisible;
  checkbox.setAttribute("aria-label", `${marker.name} tonen of verbergen`);
  label.appendChild(checkbox);

  if (marker.icon) {
    const img = document.createElement("img");
    img.className = "marker-button-icon";
    img.src = marker.icon;
    img.alt = "";
    img.loading = "lazy";
    label.appendChild(img);
  } else {
    const colorDot = document.createElement("span");
    colorDot.className = "marker-color-dot";
    colorDot.style.setProperty("--marker-color", getMarkerColor(marker));
    label.appendChild(colorDot);
  }

  const name = document.createElement("span");
  name.className = "marker-name";
  name.textContent = marker.name;
  label.appendChild(name);

  const focusButton = document.createElement("button");
  focusButton.className = "marker-focus-button";
  focusButton.type = "button";
  focusButton.textContent = "Bekijk";
  focusButton.addEventListener("click", onFocus);

  checkbox.addEventListener("change", () => {
    onVisibilityChange(checkbox.checked);
  });

  item.appendChild(label);
  item.appendChild(focusButton);

  function setVisible(visible) {
    checkbox.checked = visible;
    item.classList.toggle("is-hidden", !visible);
    focusButton.disabled = !visible;
    focusButton.textContent = visible ? "Bekijk" : "Verborgen";
  }

  setVisible(initialVisible);

  return { element: item, setVisible };
}

async function initMap() {
  const status = document.getElementById("status");
  const markerList = document.getElementById("markerList");
  const showAllButton = document.getElementById("showAllMarkers");
  const hideAllButton = document.getElementById("hideAllMarkers");

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
    const markerEntries = [];

    function updateStatus() {
      const visibleCount = markerEntries.filter((entry) => entry.visible).length;
      status.textContent = `${visibleCount} van ${markerEntries.length} marker(s) zichtbaar.`;
    }

    function setMarkerVisibility(entry, visible, shouldRemember = true) {
      entry.visible = visible;

      if (visible) {
        if (!markerLayer.hasLayer(entry.leafletMarker)) {
          entry.leafletMarker.addTo(markerLayer);
        }
      } else {
        if (entry.leafletMarker.isPopupOpen()) {
          map.closePopup();
        }
        markerLayer.removeLayer(entry.leafletMarker);
      }

      entry.ui.setVisible(visible);

      if (shouldRemember) {
        writeStoredVisibility(entry.key, visible);
      }

      updateStatus();
    }

    markers.forEach((marker, index) => {
      const key = getMarkerKey(marker, index);
      const defaultVisible = isMarkerVisibleByDefault(marker);
      const initialVisible = readStoredVisibility(key, defaultVisible);

      const leafletMarker = L.marker(toLatLng(marker.x, marker.y), {
        title: marker.name,
        icon: createMarkerIcon(marker)
      }).bindPopup(createPopupHtml(marker));

      const entry = {
        key,
        marker,
        leafletMarker,
        visible: false,
        ui: null
      };

      const ui = createMarkerListItem(
        marker,
        initialVisible,
        (visible) => setMarkerVisibility(entry, visible),
        () => {
          if (!entry.visible) return;
          map.setView(toLatLng(marker.x, marker.y), Math.max(map.getZoom(), 0.5));
          leafletMarker.openPopup();
        }
      );

      entry.ui = ui;
      markerEntries.push(entry);
      markerList.appendChild(ui.element);
      setMarkerVisibility(entry, initialVisible, false);
    });

    showAllButton.addEventListener("click", () => {
      markerEntries.forEach((entry) => setMarkerVisibility(entry, true));
    });

    hideAllButton.addEventListener("click", () => {
      markerEntries.forEach((entry) => setMarkerVisibility(entry, false));
    });

    updateStatus();

    map.on("click", async (event) => {
      const { x, y } = toXY(event.latlng);
      const snippet = `{
  "name": "Nieuwe marker",
  "x": ${x},
  "y": ${y},
  "description": "",
  "color": "#e74c3c",
  "visible": true
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
