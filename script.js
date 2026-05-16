const categories = [
  { name: "Crafting", icon: "⚒️", file: "data/crafting.json" },
  { name: "Recycling", icon: "♻️", file: "data/recycling.json" },
  { name: "Smelting", icon: "🔥", file: "data/smelting.json" },
  { name: "Jewelry", icon: "💍", file: "data/jewelry.json" }
];

let items = [];
let selectedCategory = "";

const categoryGrid = document.getElementById("categoryGrid");
const itemsGrid = document.getElementById("itemsGrid");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const typeFilter = document.getElementById("typeFilter");
const materialFilter = document.getElementById("materialFilter");
const tagFilter = document.getElementById("tagFilter");
const amountInput = document.getElementById("amountInput");

const listTitle = document.getElementById("listTitle");

async function loadItems() {
  items = [];

  try {
    for (const category of categories) {
      const response = await fetch(category.file);

      if (!response.ok) {
        throw new Error(`Kon ${category.file} niet laden`);
      }

      const categoryItems = await response.json();

      const normalizedItems = categoryItems.map(item => ({
        ...item,
        category: item.category || category.name,
        materials: normalizeMaterials(item.materials),
        tags: item.tags || []
      }));

      items.push(...normalizedItems);
    }

    fillFilters();
    renderCategories();
    renderItems();
  } catch (error) {
    console.error("Fout bij laden items:", error);
    itemsGrid.innerHTML = `
      <p class="error">
        Er ging iets mis bij het laden van de items.
        Controleer of je JSON-bestanden in de map <strong>data</strong> staan.
      </p>
    `;
  }
}

function normalizeMaterials(materials) {
  if (!Array.isArray(materials)) {
    return [];
  }

  return materials.map(material => {
    if (typeof material === "string") {
      return {
        name: material,
        amount: 1
      };
    }

    return {
      name: material.name,
      amount: Number(material.amount) || 1
    };
  });
}

function renderCategories() {
  categoryGrid.innerHTML = "";

  categories.forEach(category => {
    const card = document.createElement("div");
    card.className = "category-card";

    if (selectedCategory === category.name) {
      card.classList.add("active");
    }

    card.innerHTML = `
      <div class="icon">${category.icon}</div>
      <h3>${category.name}</h3>
    `;

    card.addEventListener("click", () => {
      selectedCategory = selectedCategory === category.name ? "" : category.name;
      categoryFilter.value = selectedCategory;

      renderItems();
    });

    categoryGrid.appendChild(card);
  });
}

function fillFilters() {
  categoryFilter.innerHTML = `<option value="">Alle categorieën</option>`;
  typeFilter.innerHTML = `<option value="">Alle types</option>`;
  materialFilter.innerHTML = `<option value="">Alle materialen</option>`;
  tagFilter.innerHTML = `<option value="">Alle tags</option>`;

  categories.forEach(category => {
    categoryFilter.innerHTML += `
      <option value="${category.name}">${category.name}</option>
    `;
  });

  const types = [
    ...new Set(items.map(item => item.type).filter(Boolean))
  ].sort();

  const materials = [
    ...new Set(
      items.flatMap(item =>
        item.materials.map(material => material.name)
      )
    )
  ].sort();

  const tags = [
    ...new Set(items.flatMap(item => item.tags || []))
  ].sort();

  types.forEach(type => {
    typeFilter.innerHTML += `
      <option value="${type}">${type}</option>
    `;
  });

  materials.forEach(material => {
    materialFilter.innerHTML += `
      <option value="${material}">${material}</option>
    `;
  });

  tags.forEach(tag => {
    tagFilter.innerHTML += `
      <option value="${tag}">${tag}</option>
    `;
  });
}

function renderItems() {
  const searchValue = searchInput.value.toLowerCase().trim();
  const categoryValue = categoryFilter.value;
  const typeValue = typeFilter.value;
  const materialValue = materialFilter.value;
  const tagValue = tagFilter.value;
  const craftAmount = Number(amountInput.value) || 1;

  selectedCategory = categoryValue;

  const filteredItems = items.filter(item => {
    const itemName = item.name.toLowerCase();
    const itemMaterials = item.materials || [];
    const itemTags = item.tags || [];

    return (
      itemName.includes(searchValue) &&
      (!categoryValue || item.category === categoryValue) &&
      (!typeValue || item.type === typeValue) &&
      (!materialValue || itemMaterials.some(material => material.name === materialValue)) &&
      (!tagValue || itemTags.includes(tagValue))
    );
  });

  listTitle.textContent = categoryValue
    ? `${categoryValue} items`
    : "Alle items";

  itemsGrid.innerHTML = "";

  if (filteredItems.length === 0) {
    itemsGrid.innerHTML = `<p>Geen items gevonden.</p>`;
    renderCategories();
    return;
  }

  filteredItems.forEach(item => {
    const card = document.createElement("div");
    card.className = "item-card";

    card.innerHTML = `
      <div class="item-top">
        <div class="item-icon">${item.icon || "📦"}</div>

        <div>
          <h3>${item.name}</h3>
          <p>Categorie: <span class="gold">${item.category}</span></p>
          <p>Type: <span class="gold">${item.type || "Onbekend"}</span></p>
        </div>
      </div>

      ${
        item.tags && item.tags.length > 0
          ? `
            <p>Tags:</p>
            <div class="materials">
              ${item.tags.map(tag => `
                <span class="material">${tag}</span>
              `).join("")}
            </div>
          `
          : ""
      }

      <p>Materialen voor ${craftAmount}x:</p>

      <div class="materials">
        ${item.materials.map(material => `
          <span class="material">
            ${material.name}: ${material.amount * craftAmount}
          </span>
        `).join("")}
      </div>
    `;

    itemsGrid.appendChild(card);
  });

  renderCategories();
}

searchInput.addEventListener("input", renderItems);
categoryFilter.addEventListener("change", renderItems);
typeFilter.addEventListener("change", renderItems);
materialFilter.addEventListener("change", renderItems);
tagFilter.addEventListener("change", renderItems);
amountInput.addEventListener("input", renderItems);

loadItems();