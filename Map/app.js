const IMAGE_URL = "map.png";
const MARKERS_URL = "markers.json";

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

  return `
    <strong class="popup-title">${escapeHtml(marker.name)}</strong>
    ${description}
    <div class="popup-meta">x: ${Math.round(marker.x)}, y: ${Math.round(marker.y)}</div>
  `;
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
        title: marker.name
      })
        .addTo(markerLayer)
        .bindPopup(createPopupHtml(marker));

      const button = document.createElement("button");
      button.className = "marker-button";
      button.type = "button";
      button.textContent = marker.name;
      button.addEventListener("click", () => {
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
  "description": ""
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
