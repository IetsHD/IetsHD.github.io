const categories = [
  { name: "Crafting", icon: "⚒️", file: "data/crafting.json" },
  { name: "Calculator", icon: "🧮", file: null },
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
const listTitle = document.getElementById("listTitle");

async function loadItems() {
  items = [];

  for (const category of categories) {
    if (!category.file) continue;

    const response = await fetch(category.file);
    const categoryItems = await response.json();

    items.push(...categoryItems);
  }

  fillFilters();
  renderCategories();
  renderItems();
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

      if (category.name === "Calculator") {
        categoryFilter.value = "";
        renderCategories();
        renderCalculator();
      } else {
        categoryFilter.value = selectedCategory;
        renderCategories();
        renderItems();
      }
    });

    categoryGrid.appendChild(card);
  });
}

function fillFilters() {
  categoryFilter.innerHTML = `<option value="">Alle categorieën</option>`;
  typeFilter.innerHTML = `<option value="">Alle types</option>`;
  materialFilter.innerHTML = `<option value="">Alle materialen</option>`;
  tagFilter.innerHTML = `<option value="">Alle tags</option>`;

  categories
    .filter(category => category.file)
    .forEach(category => {
      categoryFilter.innerHTML += `
        <option value="${category.name}">${category.name}</option>
      `;
    });

  const types = [...new Set(items.map(item => item.type))].sort();

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
    typeFilter.innerHTML += `<option value="${type}">${type}</option>`;
  });

  materials.forEach(material => {
    materialFilter.innerHTML += `<option value="${material}">${material}</option>`;
  });

  tags.forEach(tag => {
    tagFilter.innerHTML += `<option value="${tag}">${tag}</option>`;
  });
}

function renderItems() {
  const searchValue = searchInput.value.toLowerCase();
  const categoryValue = categoryFilter.value;
  const typeValue = typeFilter.value;
  const materialValue = materialFilter.value;
  const tagValue = tagFilter.value;

  selectedCategory = categoryValue;

  const filteredItems = items.filter(item => {
    return (
      item.name.toLowerCase().includes(searchValue) &&
      (!categoryValue || item.category === categoryValue) &&
      (!typeValue || item.type === typeValue) &&
      (!materialValue ||
        item.materials.some(material => material.name === materialValue)) &&
      (!tagValue || (item.tags || []).includes(tagValue))
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
        <div class="item-icon">${item.icon}</div>

        <div>
          <h3>${item.name}</h3>
          <p>Categorie: <span class="gold">${item.category}</span></p>
          <p>Type: <span class="gold">${item.type}</span></p>
        </div>
      </div>

      <p>Materialen:</p>

      <div class="materials">
        ${item.materials.map(material => `
          <span class="material">
            ${material.amount}x ${material.name}
          </span>
        `).join("")}
      </div>

      ${(item.tags && item.tags.length > 0) ? `
        <p>Tags:</p>
        <div class="materials">
          ${item.tags.map(tag => `
            <span class="material">${tag}</span>
          `).join("")}
        </div>
      ` : ""}
    `;

    itemsGrid.appendChild(card);
  });

  renderCategories();
}

function renderCalculator() {
  listTitle.textContent = "Material Calculator";

  itemsGrid.innerHTML = `
    <div class="calculator-box">
      <input 
        id="calculatorInput" 
        type="text" 
        placeholder="Bijv: Wooden Crate 3, Gold Ring 2"
      />

      <div id="calculatorResult" class="calculator-result">
        Typ een itemnaam met aantal.
      </div>
    </div>
  `;

  const calculatorInput = document.getElementById("calculatorInput");
  const calculatorResult = document.getElementById("calculatorResult");

  calculatorInput.addEventListener("input", () => {
    const value = calculatorInput.value.trim();

    if (!value) {
      calculatorResult.innerHTML = "Typ een itemnaam met aantal.";
      return;
    }

    const requests = value.split(",").map(entry => entry.trim());
    const totals = {};
    const notFound = [];

    requests.forEach(request => {
      const amountMatch = request.match(/(\d+)$/);
      const amount = amountMatch ? parseInt(amountMatch[1]) : 1;

      const itemName = request
        .replace(/(\d+)$/, "")
        .trim()
        .toLowerCase();

      const item = items.find(i => i.name.toLowerCase() === itemName);

      if (!item) {
        notFound.push(request);
        return;
      }

      item.materials.forEach(material => {
        totals[material.name] =
          (totals[material.name] || 0) + material.amount * amount;
      });
    });

    if (Object.keys(totals).length === 0) {
      calculatorResult.innerHTML = "Geen geldig item gevonden.";
      return;
    }

    calculatorResult.innerHTML = `
      <h3>Benodigde materialen</h3>

      ${Object.entries(totals).map(([name, amount]) => `
        <div class="material-row">
          <span>${name}</span>
          <strong>${amount}x</strong>
        </div>
      `).join("")}

      ${notFound.length > 0 ? `
        <p class="warning">
          Niet gevonden: ${notFound.join(", ")}
        </p>
      ` : ""}
    `;
  });
}

searchInput.addEventListener("input", renderItems);
categoryFilter.addEventListener("change", renderItems);
typeFilter.addEventListener("change", renderItems);
materialFilter.addEventListener("change", renderItems);
tagFilter.addEventListener("change", renderItems);

loadItems();