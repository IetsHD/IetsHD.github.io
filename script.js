const categories = [
  { name: "Crafting", icon: "⚒️" },
  { name: "Recycling", icon: "♻️" },
  { name: "Smelting", icon: "🔥" },
  { name: "Jewelry", icon: "💍" }
];

let items = [];
let selectedCategory = "";

const categoryGrid = document.getElementById("categoryGrid");
const itemsGrid = document.getElementById("itemsGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const typeFilter = document.getElementById("typeFilter");
const materialFilter = document.getElementById("materialFilter");
const listTitle = document.getElementById("listTitle");

async function loadItems() {
  try {
    const response = await fetch("items.json");
    items = await response.json();

    fillFilters();
    renderCategories();
    renderItems();
  } catch (error) {
    console.error("Fout bij laden items:", error);
  }
}

function renderCategories() {
  categoryGrid.innerHTML = "";

  categories.forEach(category => {
    const card = document.createElement("div");
    card.className = "category-card";
    if (selectedCategory === category.name) card.classList.add("active");

    card.innerHTML = `
      <div class="icon">${category.icon}</div>
      <h3>${category.name}</h3>
    `;

    card.addEventListener("click", () => {
      selectedCategory = selectedCategory === category.name ? "" : category.name;
      categoryFilter.value = selectedCategory;
      renderCategories();
      renderItems();
    });

    categoryGrid.appendChild(card);
  });
}

function fillFilters() {
  categoryFilter.innerHTML = `<option value="">Alle categorieën</option>`;
  typeFilter.innerHTML = `<option value="">Alle types</option>`;
  materialFilter.innerHTML = `<option value="">Alle materialen</option>`;

  categories.forEach(category => {
    categoryFilter.innerHTML += `<option value="${category.name}">${category.name}</option>`;
  });

  const types = [...new Set(items.map(item => item.type))];
  types.forEach(type => {
    typeFilter.innerHTML += `<option value="${type}">${type}</option>`;
  });

  const materials = [...new Set(items.flatMap(item => item.materials))];
  materials.forEach(material => {
    materialFilter.innerHTML += `<option value="${material}">${material}</option>`;
  });
}

function renderItems() {
  const searchValue = searchInput.value.toLowerCase();
  const categoryValue = categoryFilter.value;
  const typeValue = typeFilter.value;
  const materialValue = materialFilter.value;

  selectedCategory = categoryValue;

  const filteredItems = items.filter(item => {
    const matchesName = item.name.toLowerCase().includes(searchValue);
    const matchesCategory = !categoryValue || item.category === categoryValue;
    const matchesType = !typeValue || item.type === typeValue;
    const matchesMaterial = !materialValue || item.materials.includes(materialValue);

    return matchesName && matchesCategory && matchesType && matchesMaterial;
  });

  listTitle.textContent = categoryValue ? `${categoryValue} items` : "Alle items";

  itemsGrid.innerHTML = "";

  if (filteredItems.length === 0) {
    itemsGrid.innerHTML = `<p>Geen items gevonden.</p>`;
    return;
  }

  filteredItems.forEach(item => {
    const card = document.createElement("div");
    card.className = "item-card";

    card.innerHTML = `
      <div class="item-top">
        <div class="item-icon">${item.icon}</div>
        <div>
          <h3>${item.name}</h3>
          <p>Categorie: <span class="gold">${item.category}</span></p>
          <p>Type: <span class="gold">${item.type}</span></p>
        </div>
      </div>

      <p>Materialen:</p>
      <div class="materials">
        ${item.materials.map(material => `<span class="material">${material}</span>`).join("")}
      </div>
    `;

    itemsGrid.appendChild(card);
  });

  renderCategories();
}

loadItems();

searchInput.addEventListener("input", renderItems);
categoryFilter.addEventListener("change", renderItems);
typeFilter.addEventListener("change", renderItems);
materialFilter.addEventListener("change", renderItems);

fillFilters();
renderCategories();
renderItems();