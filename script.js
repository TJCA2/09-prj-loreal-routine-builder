/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productSearch = document.getElementById("productSearch");
const clearSearchBtn = document.getElementById("clearSearch");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const selectedProductsSection = document.querySelector(".selected-products");
const generateRoutineBtn = document.getElementById("generateRoutine");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const chatSection = document.querySelector(".chatbox");

/* Array to store selected products and all products for search */
let selectedProducts = [];
let allProducts = [];
let currentFilteredProducts = [];

/* OpenAI API endpoint */
const OPENAI_API_URL = "https://blue-frost-b76f.tjca02.workers.dev/";

/* localStorage key for saving selected products */
const STORAGE_KEY = "loreal-selected-products";

/* Load selected products from localStorage on page load */
function loadSelectedProductsFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      selectedProducts = JSON.parse(saved);
      console.log("Loaded selected products from storage:", selectedProducts);
    }
  } catch (error) {
    console.error("Error loading from localStorage:", error);
    selectedProducts = []; /* Reset to empty array if there's an error */
  }
}

/* Save selected products to localStorage */
function saveSelectedProductsToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedProducts));
    console.log("Saved selected products to storage:", selectedProducts);
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
}

/* Clear all selected products from memory and storage */
function clearAllSelectedProducts() {
  selectedProducts = [];
  saveSelectedProductsToStorage();
  updateSelectedProductsDisplay();
  updateProductCardStyles();

  /* Clear chat when no products selected */
  chatWindow.innerHTML = `
    <div class="placeholder-message">
      <p>Select products and generate a routine to start chatting!</p>
    </div>
  `;

  console.log("Cleared all selected products");
}

/* Show initial centered placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="initial-placeholder">
    <i class="fa-solid fa-arrow-up"></i>
    <p>Select a category above to view products</p>
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card" data-product-id="${product.id}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p class="product-brand">${product.brand}</p>
        <button class="description-btn" data-product-id="${product.id}">
          <i class="fa-solid fa-info-circle"></i>
          View Details
        </button>
      </div>
      <button class="select-btn">Select Product</button>
    </div>
  `
    )
    .join("");

  /* Add click event listeners to all product cards */
  addProductClickListeners(products);
  /* Add modal listeners for descriptions */
  addDescriptionModalListeners(products);
}

/* Add click event listeners to product select buttons */
function addProductClickListeners(products) {
  const productCards = document.querySelectorAll(".product-card");

  productCards.forEach((card) => {
    const selectBtn = card.querySelector(".select-btn");
    const productId = parseInt(card.dataset.productId);

    selectBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent card click when button is clicked
      toggleProductSelection(productId, products);
    });
  });
}

/* Add click event listeners for description modals */
function addDescriptionModalListeners(products) {
  const descriptionButtons = document.querySelectorAll(".description-btn");

  descriptionButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation(); /* Prevent any parent click events */

      const productId = parseInt(button.dataset.productId);
      const product = products.find((p) => p.id === productId);

      if (product) {
        showProductModal(product);
      }
    });
  });
}

/* Show product details in a modal */
function showProductModal(product) {
  /* Create modal HTML */
  const modalHTML = `
    <div class="modal-overlay" id="productModal">
      <div class="modal-content">
        <div class="modal-header">
          <img src="${product.image}" alt="${product.name}" class="modal-product-image">
          <div class="modal-product-info">
            <h3>${product.name}</h3>
            <p class="modal-brand">${product.brand}</p>
            <span class="modal-category">${product.category}</span>
          </div>
          <button class="modal-close" aria-label="Close modal">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <h4>Product Description</h4>
          <p>${product.description}</p>
        </div>
        <div class="modal-footer">
          <button class="modal-select-btn" data-product-id="${product.id}">
            <i class="fa-solid fa-plus"></i>
            Add to Routine
          </button>
        </div>
      </div>
    </div>
  `;

  /* Add modal to page */
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  /* Add event listeners */
  const modal = document.getElementById("productModal");
  const closeBtn = modal.querySelector(".modal-close");
  const selectBtn = modal.querySelector(".modal-select-btn");

  /* Close modal when clicking close button */
  closeBtn.addEventListener("click", closeProductModal);

  /* Close modal when clicking overlay */
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeProductModal();
    }
  });

  /* Close modal with Escape key */
  document.addEventListener("keydown", handleModalKeydown);

  /* Handle select button in modal */
  selectBtn.addEventListener("click", () => {
    const productId = parseInt(selectBtn.dataset.productId);
    const allProducts = window.currentProducts; /* Store products globally */
    toggleProductSelection(productId, allProducts);
    closeProductModal();
  });

  /* Show modal with animation */
  setTimeout(() => {
    modal.classList.add("show");
  }, 10);
}

/* Close product modal */
function closeProductModal() {
  const modal = document.getElementById("productModal");
  if (modal) {
    modal.classList.remove("show");
    setTimeout(() => {
      modal.remove();
      document.removeEventListener("keydown", handleModalKeydown);
    }, 300);
  }
}

/* Handle Escape key to close modal */
function handleModalKeydown(e) {
  if (e.key === "Escape") {
    closeProductModal();
  }
}

/* Toggle product selection - add or remove from selected list */
function toggleProductSelection(productId, products) {
  const product = products.find((p) => p.id === productId);
  const isSelected = selectedProducts.some((p) => p.id === productId);

  if (isSelected) {
    /* Remove product from selected list */
    selectedProducts = selectedProducts.filter((p) => p.id !== productId);
  } else {
    /* Add product to selected list */
    selectedProducts.push(product);
  }

  /* Save to localStorage whenever selection changes */
  saveSelectedProductsToStorage();

  /* Update the display */
  updateSelectedProductsDisplay();
  updateProductCardStyles();
}

/* Update the selected products display */
function updateSelectedProductsDisplay() {
  if (selectedProducts.length === 0) {
    /* Show placeholder message when no products selected */
    selectedProductsList.innerHTML = `
      <div class="placeholder-message">
        <p>No products selected yet. Choose products above to get started!</p>
      </div>
    `;
    return;
  }

  selectedProductsList.innerHTML = `
    <div class="selected-products-header">
      <button class="clear-all-btn" onclick="clearAllSelectedProducts()">
        <i class="fa-solid fa-trash"></i>
        Clear All
      </button>
    </div>
    ${selectedProducts
      .map(
        (product) => `
        <div class="selected-product-item">
          <img src="${product.image}" alt="${product.name}" class="selected-product-image">
          <span class="selected-product-name">${product.name}</span>
          <button onclick="removeProduct(${product.id})" aria-label="Remove ${product.name}" class="remove-btn">
            ×
          </button>
        </div>
      `
      )
      .join("")}
  `;
}

/* Remove product from selected list */
function removeProduct(productId) {
  selectedProducts = selectedProducts.filter((p) => p.id !== productId);

  /* Save to localStorage after removing product */
  saveSelectedProductsToStorage();

  updateSelectedProductsDisplay();
  updateProductCardStyles();

  /* Clear chat when no products selected */
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML = `
      <div class="placeholder-message">
        <p>Select products and generate a routine to start chatting!</p>
      </div>
    `;
  }
}

/* Update visual styles of product cards based on selection */
function updateProductCardStyles() {
  const productCards = document.querySelectorAll(".product-card");

  productCards.forEach((card) => {
    const productId = parseInt(card.dataset.productId);
    const isSelected = selectedProducts.some((p) => p.id === productId);
    const selectBtn = card.querySelector(".select-btn");

    if (isSelected) {
      card.classList.add("selected");
      selectBtn.textContent = "Selected ✓";
    } else {
      card.classList.remove("selected");
      selectBtn.textContent = "Select Product";
    }
  });
}

/* Filter products based on category and search term */
function filterProducts() {
  const selectedCategory = categoryFilter.value;
  const searchTerm = productSearch.value.toLowerCase().trim();

  /* Start with all products */
  let filteredProducts = allProducts;

  /* Filter by category if selected */
  if (selectedCategory) {
    filteredProducts = filteredProducts.filter(
      (product) => product.category === selectedCategory
    );
  }

  /* Filter by search term if provided */
  if (searchTerm) {
    filteredProducts = filteredProducts.filter((product) => {
      const name = product.name.toLowerCase();
      const brand = product.brand.toLowerCase();
      const description = product.description.toLowerCase();
      const category = product.category.toLowerCase();

      /* Search in name, brand, description, and category */
      return (
        name.includes(searchTerm) ||
        brand.includes(searchTerm) ||
        description.includes(searchTerm) ||
        category.includes(searchTerm)
      );
    });
  }

  /* Store current filtered products globally */
  currentFilteredProducts = filteredProducts;
  window.currentProducts = filteredProducts;

  /* Display results */
  if (filteredProducts.length === 0) {
    productsContainer.innerHTML = `
      <div class="initial-placeholder">
        <i class="fa-solid fa-search"></i>
        <p>No products found. Try adjusting your search or category filter.</p>
      </div>
    `;
  } else {
    displayProducts(filteredProducts);
    /* Update card styles after a short delay to ensure DOM is ready */
    setTimeout(() => {
      updateProductCardStyles();
    }, 100);
  }
}

/* Update search input visual state */
function updateSearchState() {
  const hasSearchTerm = productSearch.value.trim().length > 0;

  if (hasSearchTerm) {
    clearSearchBtn.classList.add("visible");
  } else {
    clearSearchBtn.classList.remove("visible");
  }
}

/* Clear search input and refresh results */
function clearSearch() {
  productSearch.value = "";
  updateSearchState();
  filterProducts();
  productSearch.focus(); /* Keep focus for better UX */
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  /* Load all products if not already loaded */
  if (allProducts.length === 0) {
    allProducts = await loadProducts();
  }

  /* Filter and display products */
  filterProducts();
});

/* Add search functionality */
productSearch.addEventListener("input", () => {
  updateSearchState();

  /* Debounce search to avoid too many filter calls */
  clearTimeout(window.searchTimeout);
  window.searchTimeout = setTimeout(async () => {
    /* Load all products if not already loaded */
    if (allProducts.length === 0) {
      allProducts = await loadProducts();
    }

    filterProducts();
  }, 300); /* Wait 300ms after user stops typing */
});

/* Add clear search button functionality */
clearSearchBtn.addEventListener("click", clearSearch);

/* Allow Enter key to trigger search */
productSearch.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    /* Trigger immediate search on Enter */
    clearTimeout(window.searchTimeout);
    filterProducts();
  }
});

/* Generate routine button click handler */
generateRoutineBtn.addEventListener("click", async () => {
  if (selectedProducts.length === 0) {
    alert("Please select at least one product to generate a routine!");
    return;
  }

  /* Create initial message with loading state */
  const productNames = selectedProducts
    .map((p) => `${p.name} by ${p.brand}`)
    .join(", ");

  chatWindow.innerHTML = `
    <div class="chat-message assistant">
      <div class="message-content">
        Great! You've selected: ${productNames}
        <br><br>
        <div class="loading-dots">
          <span>Creating your personalized routine</span>
          <span class="dots">...</span>
        </div>
      </div>
    </div>
  `;

  /* Scroll to chat section */
  chatSection.scrollIntoView({ behavior: "smooth" });

  try {
    /* Create detailed product context for AI */
    const productDetails = selectedProducts
      .map((p) => `${p.name} by ${p.brand} (${p.category}): ${p.description}`)
      .join("\n\n");

    /* Call OpenAI API to generate routine */
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You are a professional L'Oréal beauty advisor. Create personalized skincare and beauty routines based on selected products. Provide step-by-step instructions, timing, and helpful tips. Be encouraging and knowledgeable.",
          },
          {
            role: "user",
            content: `Please create a personalized routine using these products:\n\n${productDetails}\n\nInclude:\n- Step-by-step application order\n- When to use each product (AM/PM)\n- Application tips\n- Expected benefits\n\nKeep it practical and easy to follow.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    /* Replace loading message with AI response */
    chatWindow.innerHTML = `
      <div class="chat-message assistant">
        <div class="message-content">
          ${aiResponse.replace(/\n/g, "<br>")}
        </div>
      </div>
    `;
  } catch (error) {
    console.error("Error generating routine:", error);

    /* Show error message */
    chatWindow.innerHTML = `
      <div class="chat-message assistant">
        <div class="message-content">
          I apologize, but I'm having trouble generating your routine right now. Here's a basic guide for your selected products:
          <br><br>
          <strong>Your Selected Products:</strong><br>
          ${productNames}
          <br><br>
          <strong>General Tips:</strong><br>
          • Start with cleansers, then treatments, then moisturizers<br>
          • Use sunscreen during the day<br>
          • Apply products from thinnest to thickest consistency<br>
          • Give each product time to absorb before applying the next
          <br><br>
          Please try asking me specific questions about your routine!
        </div>
      </div>
    `;
  }

  /* Scroll to bottom */
  chatWindow.scrollTop = chatWindow.scrollHeight;
});

/* Chat form submission handler with OpenAI integration */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userInput = document.getElementById("userInput");
  const message = userInput.value.trim();

  if (!message) return;

  /* Add user message to chat */
  chatWindow.innerHTML += `
    <div class="chat-message user">
      <div class="message-content">
        ${message}
      </div>
    </div>
  `;

  /* Clear input and scroll */
  userInput.value = "";
  chatWindow.scrollTop = chatWindow.scrollHeight;

  /* Add loading message */
  chatWindow.innerHTML += `
    <div class="chat-message assistant loading">
      <div class="message-content">
        <div class="loading-dots">
          <span>Thinking</span>
          <span class="dots">...</span>
        </div>
      </div>
    </div>
  `;
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    /* Create context about selected products */
    const productContext =
      selectedProducts.length > 0
        ? `Selected products: ${selectedProducts
            .map((p) => `${p.name} by ${p.brand}`)
            .join(", ")}`
        : "No products currently selected";

    /* Call OpenAI API */
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `You are a professional L'Oréal beauty advisor. Help users with skincare and beauty questions. Be knowledgeable, encouraging, and practical. ${productContext}`,
          },
          {
            role: "user",
            content: message,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    /* Remove loading message and add AI response */
    const loadingMessage = chatWindow.querySelector(".loading");
    if (loadingMessage) {
      loadingMessage.remove();
    }

    chatWindow.innerHTML += `
      <div class="chat-message assistant">
        <div class="message-content">
          ${aiResponse.replace(/\n/g, "<br>")}
        </div>
      </div>
    `;
  } catch (error) {
    console.error("Error getting AI response:", error);

    /* Remove loading message and show error */
    const loadingMessage = chatWindow.querySelector(".loading");
    if (loadingMessage) {
      loadingMessage.remove();
    }

    chatWindow.innerHTML += `
      <div class="chat-message assistant">
        <div class="message-content">
          I apologize, but I'm having trouble responding right now. Please try again in a moment, or feel free to ask another question about your beauty routine!
        </div>
      </div>
    `;
  }

  /* Scroll to bottom */
  chatWindow.scrollTop = chatWindow.scrollHeight;
});

/* Initialize - ensure sections are hidden by default */
selectedProductsSection.classList.remove("visible");
chatSection.classList.remove("visible");

/* Initialize selected products display with placeholder */
chatWindow.innerHTML = `
  <div class="placeholder-message">
    <p>Select products and generate a routine to start chatting!</p>
  </div>
`;

/* Initialize the app */
async function initializeApp() {
  /* Load saved products from localStorage first */
  loadSelectedProductsFromStorage();

  /* Load all products for search functionality */
  allProducts = await loadProducts();

  /* Update displays with any saved products */
  updateSelectedProductsDisplay();

  /* Initialize chat display */
  chatWindow.innerHTML = `
    <div class="placeholder-message">
      <p>Select products and generate a routine to start chatting!</p>
    </div>
  `;

  /* If there are saved products and a category is selected, update the display */
  if (selectedProducts.length > 0) {
    /* Small delay to ensure any existing products are rendered first */
    setTimeout(() => {
      updateProductCardStyles();
    }, 200);
  }

  /* Initialize search state */
  updateSearchState();
}

/* Call initialization when page loads */
initializeApp();
