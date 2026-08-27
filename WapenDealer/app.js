const productList = document.getElementById("productList");
const categoryFilters = document.getElementById("categoryFilters");
const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const searchWrap = document.querySelector(".search-wrap");
const resultCount = document.getElementById("resultCount");
const productStat = document.getElementById("productStat");
const categoryStat = document.getElementById("categoryStat");

const openCartBtn = document.getElementById("openCartBtn");
const closeCartBtn = document.getElementById("closeCartBtn");
const cartScreen = document.getElementById("cartScreen");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const summaryItems = document.getElementById("summaryItems");
const summaryTotal = document.getElementById("summaryTotal");
const clearCartBtn = document.getElementById("clearCartBtn");
const resetQuantitiesBtn = document.getElementById("resetQuantitiesBtn");
const toast = document.getElementById("toast");

const CATEGORY_ORDER = ["Pistols", "SMG", "Ammo", "Not For Sale"];

let products = [];
let cart = loadCart();
let activeCategory = "Alles";
let searchTerm = "";
let toastTimer;

init();

async function init() {
  bindEvents();
  await loadProducts();

  cart = cart.filter(item => findProduct(item.id));
  renderStats();
  renderFilters();
  renderProducts();
  renderCart();
}

function bindEvents() {
  searchInput.addEventListener("input", handleSearch);
  clearSearchBtn.addEventListener("click", clearSearch);
  openCartBtn.addEventListener("click", openCart);
  closeCartBtn.addEventListener("click", closeCart);
  cartScreen.addEventListener("click", handleCartBackdropClick);
  clearCartBtn.addEventListener("click", clearCart);
  resetQuantitiesBtn.addEventListener("click", resetQuantityInputs);
  productList.addEventListener("click", handleProductAction);
  cartItems.addEventListener("click", handleCartAction);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && cartScreen.classList.contains("open")) {
      closeCart();
    }
  });
}

async function loadProducts() {
  const categoryFiles = [
    { path: new URL("data/Pistol.json", import.meta.url), source: "pistol" },
    { path: new URL("data/SMG.json", import.meta.url), source: "smg" },
    { path: new URL("data/Ammo.json", import.meta.url), source: "ammo" }
  ];

  try {
    const productGroups = await Promise.all(
      categoryFiles.map(async file => {
        const response = await fetch(file.path);

        if (!response.ok) {
          throw new Error(`${file.path} kon niet worden geladen.`);
        }

        const items = await response.json();
        return items.map(product => normalizeProduct(product, file.source));
      })
    );

    const customProducts = loadCustomProducts().map((product, index) =>
      normalizeProduct(product, `custom-${index + 1}`)
    );

    products = [...productGroups.flat(), ...customProducts];
  } catch (error) {
    console.error(error);
    productList.innerHTML = `
      <div class="empty-state">
        De catalogus kon niet worden geladen. Vernieuw de pagina om het opnieuw te proberen.
      </div>
    `;
  }
}

function normalizeProduct(product, source) {
  return {
    ...product,
    id: `${source}-${product.id}`,
    name: String(product.name),
    category: String(product.category),
    price: Number(product.price) || 0
  };
}

function renderStats() {
  const categories = new Set(products.map(product => product.category));
  productStat.textContent = products.length;
  categoryStat.textContent = categories.size;
}

function renderFilters() {
  const categories = [...new Set(products.map(product => product.category))]
    .sort(sortCategories);
  const filters = ["Alles", ...categories];

  categoryFilters.innerHTML = filters
    .map(category => {
      const activeClass = category === activeCategory ? "active" : "";
      const count = category === "Alles"
        ? products.length
        : products.filter(product => product.category === category).length;

      return `
        <button
          class="filter-button ${activeClass}"
          type="button"
          data-category="${escapeHtml(category)}"
          aria-pressed="${category === activeCategory}"
        >
          ${escapeHtml(category)} · ${count}
        </button>
      `;
    })
    .join("");

  categoryFilters.querySelectorAll(".filter-button").forEach(button => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      renderFilters();
      renderProducts();
    });
  });
}

function renderProducts() {
  const filteredProducts = getFilteredProducts();
  resultCount.textContent = `${filteredProducts.length} ${filteredProducts.length === 1 ? "resultaat" : "resultaten"}`;

  if (filteredProducts.length === 0) {
    productList.innerHTML = `
      <div class="empty-state">
        Geen producten gevonden. Probeer een andere zoekterm of categorie.
      </div>
    `;
    return;
  }

  const groupedProducts = groupByCategory(filteredProducts);

  productList.innerHTML = Object.entries(groupedProducts)
    .sort(([categoryA], [categoryB]) => sortCategories(categoryA, categoryB))
    .map(([category, items]) => `
      <section class="category-section" aria-labelledby="category-${slugify(category)}">
        <div class="category-header">
          <h3 class="category-title" id="category-${slugify(category)}">${escapeHtml(category)}</h3>
          <span class="category-count">${items.length}</span>
          <span class="category-line" aria-hidden="true"></span>
        </div>

        <div class="product-grid">
          ${items.map((product, index) => createProductCard(product, index)).join("")}
        </div>
      </section>
    `)
    .join("");
}

function getFilteredProducts() {
  const normalizedSearch = searchTerm.toLocaleLowerCase("nl");

  return products.filter(product => {
    const matchesCategory = activeCategory === "Alles" || product.category === activeCategory;
    const matchesSearch =
      product.name.toLocaleLowerCase("nl").includes(normalizedSearch) ||
      product.category.toLocaleLowerCase("nl").includes(normalizedSearch);

    return matchesCategory && matchesSearch;
  });
}

function createProductCard(product, index) {
  const isUnavailable = product.category.toLowerCase() === "not for sale";
  const productNumber = String(index + 1).padStart(2, "0");

  return `
    <article class="product-card">
      <div class="product-top">
        <span class="category-mark" aria-hidden="true">${getCategoryMark(product.category)}</span>
        <span class="product-index">N° ${productNumber}</span>
      </div>

      <div class="product-info">
        <h3>${escapeHtml(product.name)}</h3>
        <span class="badge ${isUnavailable ? "not-for-sale" : ""}">${escapeHtml(product.category)}</span>
      </div>

      <div class="product-bottom">
        <span class="price">${formatPrice(product.price)}</span>
        ${isUnavailable ? `
          <span class="unavailable-label">Niet beschikbaar</span>
        ` : `
          <div class="add-control">
            <div class="quantity-stepper">
              <button class="step-button" type="button" data-step="-1" data-id="${escapeHtml(product.id)}" aria-label="Aantal ${escapeHtml(product.name)} verlagen">−</button>
              <input
                class="quantity-input"
                type="number"
                min="1"
                max="9999"
                step="1"
                value="1"
                inputmode="numeric"
                aria-label="Aantal voor ${escapeHtml(product.name)}"
                data-id="${escapeHtml(product.id)}"
              />
              <button class="step-button" type="button" data-step="1" data-id="${escapeHtml(product.id)}" aria-label="Aantal ${escapeHtml(product.name)} verhogen">+</button>
            </div>
            <button class="add-button" type="button" data-id="${escapeHtml(product.id)}">Voeg toe</button>
          </div>
        `}
      </div>
    </article>
  `;
}

function handleProductAction(event) {
  const stepButton = event.target.closest(".step-button");

  if (stepButton) {
    const input = stepButton.closest(".quantity-stepper").querySelector(".quantity-input");
    const currentValue = Number.parseInt(input.value, 10) || 1;
    input.value = Math.min(9999, Math.max(1, currentValue + Number(stepButton.dataset.step)));
    return;
  }

  const addButton = event.target.closest(".add-button");

  if (!addButton) {
    return;
  }

  const productId = addButton.dataset.id;
  const card = addButton.closest(".product-card");
  const input = card.querySelector(".quantity-input");
  const quantity = Number.parseInt(input.value, 10);

  if (!Number.isInteger(quantity) || quantity <= 0) {
    input.value = 1;
    return;
  }

  addToCart(productId, Math.min(quantity, 9999));
  input.value = 1;
}

function renderCart() {
  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="empty-state">Je bestellijst is nog leeg.</div>
    `;
  } else {
    cartItems.innerHTML = cart
      .map(item => {
        const product = findProduct(item.id);

        if (!product) {
          return "";
        }

        return `
          <article class="cart-item">
            <div>
              <h3>${escapeHtml(product.name)}</h3>
              <p>${escapeHtml(product.category)} · ${formatPrice(product.price)} per stuk<br />Subtotaal ${formatPrice(product.price * item.quantity)}</p>
            </div>

            <div class="cart-item-actions">
              <button class="small-button" type="button" data-action="decrease" data-id="${escapeHtml(item.id)}" aria-label="Aantal ${escapeHtml(product.name)} verlagen">−</button>
              <span class="quantity-number">${item.quantity}</span>
              <button class="small-button" type="button" data-action="increase" data-id="${escapeHtml(item.id)}" aria-label="Aantal ${escapeHtml(product.name)} verhogen">+</button>
              <button class="small-button remove-button" type="button" data-action="remove" data-id="${escapeHtml(item.id)}" aria-label="${escapeHtml(product.name)} verwijderen">×</button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => {
    const product = findProduct(item.id);
    return product ? sum + product.price * item.quantity : sum;
  }, 0);

  cartCount.textContent = totalQuantity;
  summaryItems.textContent = totalQuantity;
  summaryTotal.textContent = formatPrice(totalPrice);
  saveCart();
}

function handleCartAction(event) {
  const button = event.target.closest(".small-button");

  if (!button) {
    return;
  }

  const { action, id } = button.dataset;

  if (action === "increase") changeCartQuantity(id, 1);
  if (action === "decrease") changeCartQuantity(id, -1);
  if (action === "remove") removeFromCart(id);
}

function addToCart(productId, quantity) {
  const product = findProduct(productId);

  if (!product) {
    return;
  }

  const existingItem = cart.find(item => item.id === productId);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({ id: productId, quantity });
  }

  renderCart();
  showToast(`${quantity}× ${product.name} toegevoegd`);
}

function changeCartQuantity(productId, change) {
  const item = cart.find(cartItem => cartItem.id === productId);

  if (!item) {
    return;
  }

  item.quantity += change;

  if (item.quantity <= 0) {
    removeFromCart(productId);
    return;
  }

  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  renderCart();
}

function clearCart() {
  if (cart.length === 0) {
    return;
  }

  if (!confirm("Weet je zeker dat je de bestellijst wilt leegmaken?")) {
    return;
  }

  cart = [];
  renderCart();
  showToast("Bestellijst leeggemaakt");
}

function handleSearch(event) {
  searchTerm = event.target.value.trim();
  searchWrap.classList.toggle("has-value", searchTerm.length > 0);
  renderProducts();
}

function clearSearch() {
  searchInput.value = "";
  searchTerm = "";
  searchWrap.classList.remove("has-value");
  searchInput.focus();
  renderProducts();
}

function openCart() {
  cartScreen.classList.add("open");
  cartScreen.setAttribute("aria-hidden", "false");
  document.body.classList.add("cart-open");
  closeCartBtn.focus();
}

function closeCart() {
  cartScreen.classList.remove("open");
  cartScreen.setAttribute("aria-hidden", "true");
  document.body.classList.remove("cart-open");
  openCartBtn.focus();
}

function handleCartBackdropClick(event) {
  if (event.target === cartScreen) {
    closeCart();
  }
}

function resetQuantityInputs() {
  document.querySelectorAll(".quantity-input").forEach(input => {
    input.value = 1;
  });
  showToast("Aantallen gereset");
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function groupByCategory(items) {
  return items.reduce((groups, item) => {
    (groups[item.category] ||= []).push(item);
    return groups;
  }, {});
}

function sortCategories(categoryA, categoryB) {
  const indexA = CATEGORY_ORDER.indexOf(categoryA);
  const indexB = CATEGORY_ORDER.indexOf(categoryB);
  const orderA = indexA === -1 ? CATEGORY_ORDER.length : indexA;
  const orderB = indexB === -1 ? CATEGORY_ORDER.length : indexB;
  return orderA - orderB || categoryA.localeCompare(categoryB, "nl");
}

function findProduct(productId) {
  return products.find(product => product.id === String(productId));
}

function getCategoryMark(category) {
  const marks = {
    Pistols: "P",
    SMG: "S",
    Ammo: "A",
    "Not For Sale": "—"
  };

  return marks[category] || category.slice(0, 1).toUpperCase();
}

function formatPrice(price) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(price);
}

function saveCart() {
  localStorage.setItem("obsidianCart", JSON.stringify(cart));
}

function loadCart() {
  const savedCart = localStorage.getItem("obsidianCart") || localStorage.getItem("netjesGeregeldCart");

  if (!savedCart) {
    return [];
  }

  try {
    return JSON.parse(savedCart).map(item => ({
      id: String(item.id),
      quantity: Number(item.quantity) || 0
    }));
  } catch {
    return [];
  }
}

function loadCustomProducts() {
  const savedProducts = localStorage.getItem("netjesGeregeldCustomProducts");

  if (!savedProducts) {
    return [];
  }

  try {
    return JSON.parse(savedProducts);
  } catch {
    return [];
  }
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
