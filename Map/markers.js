const STORAGE_KEY = "gta-map-app-markers-v1";

// Deze afbeelding moet in dezelfde map staan als index.html.
const MAP_IMAGE = "Map.png";

// Afmetingen van de meegeleverde kaart.
const MAP_WIDTH = 1536;
const MAP_HEIGHT = 1536;

const map = L.map("map", {
  crs: L.CRS.Simple,
  minZoom: -2,
  maxZoom: 4,
  zoomControl: true,
  attributionControl: false
});

const bounds = [[0, 0], [MAP_HEIGHT, MAP_WIDTH]];

L.imageOverlay(MAP_IMAGE, bounds).addTo(map);
map.fitBounds(bounds);
map.setMaxBounds(bounds);

let markers = [];

const markerList = document.getElementById("markerList");

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function saveMarkers() {
  const data = markers.map(item => ({
    id: item.id,
    name: item.name,
    x: item.marker.getLatLng().lng,
    y: item.marker.getLatLng().lat
  }));

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  renderMarkerList();
}

function popupContent(item) {
  return `
    <div class="popup-title">${escapeHtml(item.name)}</div>
    <div>X: ${Math.round(item.marker.getLatLng().lng)} | Y: ${Math.round(item.marker.getLatLng().lat)}</div>
    <div class="popup-actions">
      <button onclick="renameMarker('${item.id}')">Naam wijzigen</button>
      <button class="danger" onclick="deleteMarker('${item.id}')">Marker verwijderen</button>
    </div>
  `;
}

function refreshPopup(item) {
  item.marker.bindPopup(popupContent(item));
}

function addMarker(y, x, name, id = crypto.randomUUID()) {
  const marker = L.marker([y, x], {
    draggable: true
  }).addTo(map);

  const item = { id, name, marker };
  markers.push(item);

  refreshPopup(item);

  marker.on("dragend", () => {
    refreshPopup(item);
    saveMarkers();
  });

  marker.openPopup();
  saveMarkers();
}

function renderMarkerList() {
  markerList.innerHTML = "";

  if (markers.length === 0) {
    markerList.innerHTML = `<li class="empty">Nog geen markers. Klik op de kaart om je eerste marker te maken.</li>`;
    return;
  }

  markers.forEach(item => {
    const li = document.createElement("li");
    li.className = "marker-item";

    const latlng = item.marker.getLatLng();

    li.innerHTML = `
      <strong>${escapeHtml(item.name)}</strong>
      <small>X: ${Math.round(latlng.lng)} | Y: ${Math.round(latlng.lat)}</small>
      <div class="actions">
        <button type="button" data-action="go">Ga naar</button>
        <button type="button" data-action="delete" class="danger">Verwijder</button>
      </div>
    `;

    li.querySelector('[data-action="go"]').addEventListener("click", () => {
      map.setView(item.marker.getLatLng(), 1);
      item.marker.openPopup();
    });

    li.querySelector('[data-action="delete"]').addEventListener("click", () => {
      deleteMarker(item.id);
    });

    markerList.appendChild(li);
  });
}

window.renameMarker = function(id) {
  const item = markers.find(markerItem => markerItem.id === id);
  if (!item) return;

  const newName = prompt("Nieuwe naam voor deze marker:", item.name);
  if (!newName || !newName.trim()) return;

  item.name = newName.trim();
  refreshPopup(item);
  item.marker.openPopup();
  saveMarkers();
};

window.deleteMarker = function(id) {
  const item = markers.find(markerItem => markerItem.id === id);
  if (!item) return;

  map.removeLayer(item.marker);
  markers = markers.filter(markerItem => markerItem.id !== id);
  saveMarkers();
};

function loadMarkers() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    renderMarkerList();
    return;
  }

  try {
    const data = JSON.parse(saved);

    data.forEach(item => {
      if (
        item.name &&
        typeof item.x === "number" &&
        typeof item.y === "number"
      ) {
        addMarker(item.y, item.x, item.name, item.id || crypto.randomUUID());
      }
    });
  } catch (error) {
    console.error("Markers konden niet worden geladen:", error);
    renderMarkerList();
  }
}

map.on("click", event => {
  const name = prompt("Naam van deze marker:");
  if (!name || !name.trim()) return;

  addMarker(event.latlng.lat, event.latlng.lng, name.trim());
});

document.getElementById("fitMap").addEventListener("click", () => {
  map.fitBounds(bounds);
});

document.getElementById("clearMarkers").addEventListener("click", () => {
  if (!confirm("Weet je zeker dat je alle markers wilt verwijderen?")) return;

  markers.forEach(item => map.removeLayer(item.marker));
  markers = [];
  saveMarkers();
});

document.getElementById("exportMarkers").addEventListener("click", async () => {
  const data = markers.map(item => ({
    name: item.name,
    x: Math.round(item.marker.getLatLng().lng),
    y: Math.round(item.marker.getLatLng().lat)
  }));

  const json = JSON.stringify(data, null, 2);

  try {
    await navigator.clipboard.writeText(json);
    alert("Markers zijn gekopieerd naar je klembord.");
  } catch {
    prompt("Kopieer deze marker-data:", json);
  }
});

document.getElementById("importMarkers").addEventListener("click", () => {
  const json = prompt("Plak hier je marker-data JSON:");
  if (!json) return;

  try {
    const data = JSON.parse(json);
    if (!Array.isArray(data)) throw new Error("Geen lijst");

    data.forEach(item => {
      if (item.name && typeof item.x === "number" && typeof item.y === "number") {
        addMarker(item.y, item.x, item.name);
      }
    });
  } catch {
    alert("Deze JSON kon niet worden geïmporteerd.");
  }
});

loadMarkers();
