let cars = [];
let searchTerm = "";

const grid = document.getElementById("catalogGrid");
const filterBar = document.getElementById("filterBar");
const searchInput = document.getElementById("searchInput");
const modal = document.getElementById("detailsModal");

async function loadCars() {
  const res = await fetch("cars.json");
  cars = await res.json();
  renderFilters();
  renderCars();
}

function renderFilters() {
  const types = ["All", ...new Set(cars.map(c => c.type))];
  filterBar.innerHTML = "";

  types.forEach(type => {
    const btn = document.createElement("button");
    btn.textContent = type;
    btn.onclick = () => {
      activeType = type;
      renderCars();
    };
    filterBar.appendChild(btn);
  });
}

function renderCars() {
  grid.innerHTML = "";

  const filtered = cars.filter(c =>
    (activeType === "All" || c.type === activeType) &&
    (c.name.toLowerCase().includes(searchTerm) ||
     c.brand.toLowerCase().includes(searchTerm))
  );

  filtered.forEach(car => {
    const div = document.createElement("div");
    div.className = "car-card";
    div.innerHTML = `
      <img src="${car.image}" />
      <h3>${car.name}</h3>
      <p>$${car.price}</p>
    `;

    div.onclick = () => openModal(car);
    grid.appendChild(div);
  });
}

function openModal(car) {
  document.getElementById("modalImage").src = car.image;
  document.getElementById("modalTitle").textContent = car.name;
  document.getElementById("modalPrice").textContent = "$" + car.price;
  document.getElementById("modalDescription").textContent = car.description;

  modal.classList.add("open");
}

document.getElementById("closeModalBtn").onclick = () => {
  modal.classList.remove("open");
};

searchInput.addEventListener("input", e => {
  searchTerm = e.target.value.toLowerCase();
  renderCars();
});

loadCars();