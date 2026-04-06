const cars = [
  {
    name: "Panto",
    brand: "Benefactor",
    price: 6000,
    category: "Compacts",
    klasse: "C",
    kofferbak: 100,
    seats: 2,
    image: "https://i.ibb.co/TqxY9D1S/Panto.png"
  },
  {
    name: "Rhapsody",
    brand: "Declasse",
    price: 8500,
    category: "Compacts",
    klasse: "D",
    kofferbak: 100,
    seats: 4,
    image: "https://i.ibb.co/zW7FHQJY/Rhapsody.png"
  },
  {
    name: "Blazer",
    brand: "Annis",
    price: 7500,
    category: "SUV",
    klasse: "B",
    kofferbak: 300,
    seats: 2,
    image: "https://via.placeholder.com/200"
  }
];

const grid = document.getElementById("carGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");

function renderCars(list) {
  grid.innerHTML = "";

  list.forEach(car => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${car.image}">
      <h3>${car.brand} ${car.name}</h3>
      <p>€${car.price}</p>
      <span class="badge">${car.klasse}</span>
      <span class="badge">${car.kofferbak}KG</span>
      <span class="badge">${car.seats}Seats</span>
    `;

    card.onclick = () => showDetails(car);

    grid.appendChild(card);
  });
}

function showDetails(car) {
  const modal = document.getElementById("modal");
  const details = document.getElementById("modalDetails");

  details.innerHTML = `
    <h2>${car.brand} ${car.name}</h2>
    <p><b>Price:</b> €${car.price}</p>
    <p><b>Category:</b> ${car.category}</p>
    <p><b>Class:</b> ${car.klasse}</p>
    <p><b>Trunk Space:</b> ${car.kofferbak}KG</p>
    <p><b>Seats:</b> ${car.seats}</p>
  `;

  modal.classList.remove("hidden");
}

document.getElementById("closeModal").onclick = () => {
  document.getElementById("modal").classList.add("hidden");
};

function filterCars() {
  const search = searchInput.value.toLowerCase();
  const category = categoryFilter.value;

  const filtered = cars.filter(car => {
    const matchesSearch =
      car.name.toLowerCase().includes(search) ||
      car.brand.toLowerCase().includes(search) ||
      car.klasse.toLowerCase().includes(search) ||
      car.kofferbak.toString().includes(search) ||
      car.seats.toString().includes(search);

    const matchesCategory =
      category === "all" || car.category === category;

    return matchesSearch && matchesCategory;
  });

  renderCars(filtered);
}

searchInput.addEventListener("input", filterCars);
categoryFilter.addEventListener("change", filterCars);

// Initial render
renderCars(cars);