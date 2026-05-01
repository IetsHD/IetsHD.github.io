const categories = [
  { name: "Crafting", icon: "🛠️" },
  { name: "Recycling", icon: "♻️" },
  { name: "Smelting", icon: "🔥" },
  { name: "Jewelry", icon: "💍" }
];

const items = [
  {
    name: "Wooden Handle",
    category: "Crafting",
    type: "Component",
    materials: ["Wood", "Glue"]
  },
  {
    name: "Iron Ingot",
    category: "Smelting",
    type: "Metal",
    materials: ["Iron Ore", "Coal"]
  },
  {
    name: "Gold Ring",
    category: "Jewelry",
    type: "Accessory",
    materials: ["Gold Ingot", "Gemstone"]
  },
  {
    name: "Scrap Metal",
    category: "Recycling",
    type: "Material",
    materials: ["Broken Tools", "Metal Waste"]
  },
  {
    name: "Silver Necklace",
    category: "Jewelry",
    type: "Accessory",
    materials: ["Silver Ingot", "String"]
  }
];

let activeCategory = "";

const categoryIcons = document.getElementById("categoryIcons");
const itemList = document.getElementById("itemList");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const typeFilter = document.getElementById("typeFilter");
const materialFilter = document.getElementById("materialFilter");
const activeTitle = document.getElementById("activeTitle");

function renderCategories() {
  categoryIcons.innerHTML = "";

  categories.forEach(category => {
    const card = document.createElement("div");
    card.className = "category-card";
    card.innerHTML = `
      <div class="category-icon">${category.icon}</div>
      <strong>${category.name}</strong>
    `;

    card.addEventListener("click", () => {
      activeCategory = activeCategory === category.name ? "" : category.name;
      categoryFilter.value = activeCategory;
      renderCategories();
      renderItems();
    });

    if (activeCategory === category.name) {
      card.classList.add("active");
    }

    categoryIcons.appendChild(card);
  });
}

function fillFilters() {
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
  const search = searchInput.value.toLowerCase();
  const category = categoryFilter.value;
  const type = typeFilter.value;
  const material = materialFilter.value;

  activeCategory = category;
  activeTitle.textContent = category ? category + " items" : "Alle items";

  const filteredItems = items.filter(item => {
    return (
      item.name.toLowerCase().includes(search) &&
      (category === "" || item.category === category) &&
      (type === "" || item.type === type) &&
      (material === "" || item.materials.includes(material))
    );
  });

  itemList.innerHTML = "";

  if (filteredItems.length === 0) {
    itemList.innerHTML = "<p>Geen items gevonden.</p>";
    return;
  }

  filteredItems.forEach(item => {
    const card = document.createElement("div");
    card.className = "item-card";

    card.innerHTML = `
      <h3>${item.name}</h3>
      <p><strong>Categorie:</strong> ${item.category}</p>
      <p><strong>Type:</strong> ${item.type}</p>
      <p><strong>Materialen:</strong></p>
      ${item.materials.map(material => `<span class="tag">${material}</span>`).join("")}
    `;

    itemList.appendChild(card);
  });

  renderCategories();
}

searchInput.addEventListener("input", renderItems);
categoryFilter.addEventListener("change", renderItems);
typeFilter.addEventListener("change", renderItems);
materialFilter.addEventListener("change", renderItems);

fillFilters();
renderCategories();
renderItems();