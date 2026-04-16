const DEFAULT_CATEGORY = "Без категории";
const CATEGORY_MEDIA = {
    "Рыба": "https://images.unsplash.com/photo-1510130387422-82bed34b37e9?auto=format&fit=crop&w=1200&q=80",
    "Ягоды": "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1200&q=80",
    "Консервы": "https://images.unsplash.com/photo-1584263347416-85a696b4eda7?auto=format&fit=crop&w=1200&q=80",
    "Десерты": "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80",
    "Подарочные наборы": "https://images.unsplash.com/photo-1513475382585-d06e58bcb0ff?auto=format&fit=crop&w=1200&q=80",
    "Соусы и закуски": "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1200&q=80",
    "Без категории": "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=1200&q=80"
};

async function loadCatalog() {
    const res = await fetch("/api/products");
    if (!res.ok) throw new Error("API недоступен");
    return await res.json();
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function normalizeCategory(item) {
    return item.category && String(item.category).trim()
        ? String(item.category).trim()
        : DEFAULT_CATEGORY;
}

function buildProductCard(item, currentQty) {
    const image = item.image || "https://via.placeholder.com/400x300?text=Фото";
    const category = normalizeCategory(item);

    return `
        <article class="card" data-category="${escapeHtml(category)}">
            <div class="card-media">
                <img src="${escapeHtml(image)}" alt="${escapeHtml(item.title)}">
                <span class="card-category">${escapeHtml(category)}</span>
            </div>
            <div class="card-body">
                <div class="card-title-row">
                    <h3>${escapeHtml(item.title)}</h3>
                    <strong>${Number(item.price).toLocaleString("ru-RU")} ₽</strong>
                </div>
                <p>${escapeHtml(item.description)}</p>
                <div class="stock ${item.stock > 0 ? "available" : "unavailable"}">
                    ${item.stock > 0 ? `В наличии: ${item.stock}` : "Нет в наличии"}
                </div>
                <div class="qty-container" data-id="${item.id}">
                    ${item.stock > 0 ? (
                        currentQty > 0 ? `
                            <div class="qty-control-inline">
                                <button class="qty-btn-inline qty-minus" data-id="${item.id}">-</button>
                                <span class="qty-display-inline">${currentQty}</span>
                                <button class="qty-btn-inline qty-plus" data-id="${item.id}">+</button>
                            </div>
                        ` : `
                            <button class="add-to-cart-btn" data-id="${item.id}">В корзину</button>
                        `
                    ) : `
                        <div class="out-of-stock-label">Нет в наличии</div>
                    `}
                </div>
            </div>
        </article>
    `;
}

loadCatalog()
    .then(items => {
        const catalog = document.getElementById("catalog");
        const filters = document.getElementById("catalog-filters");
        const categoryCards = document.getElementById("category-cards");
        const categoryMap = new Map();
        let activeCategory = "all";

        items.forEach(item => {
            const category = normalizeCategory(item);
            item.category = category;
            if (!categoryMap.has(category)) categoryMap.set(category, []);
            categoryMap.get(category).push(item);
        });

        const categories = Array.from(categoryMap.keys()).sort((a, b) => a.localeCompare(b, "ru"));

        function updateAllButtons() {
            const containers = document.querySelectorAll(".card .qty-container");
            containers.forEach(container => {
                const itemId = parseInt(container.dataset.id);
                const cartItem = cart.find(i => i.id === itemId);
                const qty = cartItem ? cartItem.qty : 0;

                const item = items.find(i => i.id === itemId);
                const inStock = item && item.stock > 0;

                if (!inStock) {
                    container.innerHTML = '<div class="out-of-stock-label">Нет в наличии</div>';
                    return;
                }

                if (qty === 0) {
                    container.innerHTML = `<button class="add-to-cart-btn" data-id="${itemId}">В корзину</button>`;
                } else {
                    container.innerHTML = `
                        <div class="qty-control-inline">
                            <button class="qty-btn-inline qty-minus" data-id="${itemId}">-</button>
                            <span class="qty-display-inline">${qty}</span>
                            <button class="qty-btn-inline qty-plus" data-id="${itemId}">+</button>
                        </div>
                    `;
                }
            });

            attachButtonHandlers();
        }

        function attachButtonHandlers() {
            document.querySelectorAll(".add-to-cart-btn").forEach(btn => {
                btn.onclick = () => {
                    const itemId = parseInt(btn.dataset.id);
                    const item = items.find(i => i.id === itemId);
                    if (item) {
                        addToCart(item);
                        updateAllButtons();
                    }
                };
            });

            document.querySelectorAll(".qty-plus").forEach(btn => {
                btn.onclick = () => {
                    const itemId = parseInt(btn.dataset.id);
                    const cartItem = cart.find(i => i.id === itemId);
                    if (cartItem) {
                        changeQty(cart.indexOf(cartItem), 1);
                        updateAllButtons();
                    }
                };
            });

            document.querySelectorAll(".qty-minus").forEach(btn => {
                btn.onclick = () => {
                    const itemId = parseInt(btn.dataset.id);
                    const cartItem = cart.find(i => i.id === itemId);
                    if (cartItem) {
                        changeQty(cart.indexOf(cartItem), -1);
                        updateAllButtons();
                    }
                };
            });
        }

        function renderFilters() {
            const buttons = [
                `<button class="catalog-filter${activeCategory === "all" ? " is-active" : ""}" data-category="all" type="button">Все</button>`,
                ...categories.map(category => `
                    <button class="catalog-filter${activeCategory === category ? " is-active" : ""}" data-category="${escapeHtml(category)}" type="button">
                        ${escapeHtml(category)}
                    </button>
                `)
            ];
            filters.innerHTML = buttons.join("");

            filters.querySelectorAll(".catalog-filter").forEach(button => {
                button.onclick = () => {
                    activeCategory = button.dataset.category;
                    renderFilters();
                    renderCatalog();
                };
            });
        }

        function renderCategoryCards() {
            categoryCards.innerHTML = categories.map(category => {
                const itemsInCategory = categoryMap.get(category) || [];
                const image = CATEGORY_MEDIA[category] || CATEGORY_MEDIA[DEFAULT_CATEGORY];
                return `
                    <button class="category-card" type="button" data-category-card="${escapeHtml(category)}" style="background-image: linear-gradient(180deg, rgba(33, 31, 29, 0.08), rgba(33, 31, 29, 0.68)), url('${escapeHtml(image)}');">
                        <span class="category-card__count">${itemsInCategory.length} ${itemsInCategory.length === 1 ? "позиция" : "позиций"}</span>
                        <span class="category-card__title">${escapeHtml(category)}</span>
                    </button>
                `;
            }).join("");

            categoryCards.querySelectorAll(".category-card").forEach(button => {
                button.onclick = () => {
                    activeCategory = button.dataset.categoryCard;
                    renderFilters();
                    renderCatalog();
                    const target = document.querySelector(`[data-category-section="${CSS.escape(activeCategory)}"]`);
                    target?.scrollIntoView({ behavior: "smooth", block: "start" });
                };
            });
        }

        function renderCatalog() {
            const visibleCategories = activeCategory === "all"
                ? categories
                : categories.filter(category => category === activeCategory);

            catalog.innerHTML = visibleCategories.map(category => {
                const sectionItems = categoryMap.get(category) || [];
                return `
                    <section class="catalog-section" data-category-section="${escapeHtml(category)}">
                        <div class="catalog-section-header">
                            <h3>${escapeHtml(category)}</h3>
                            <span>${sectionItems.length} ${sectionItems.length === 1 ? "позиция" : "позиций"}</span>
                        </div>
                        <div class="catalog-grid">
                            ${sectionItems.map(item => {
                                const currentQty = cart.find(i => i.id === item.id)?.qty || 0;
                                return buildProductCard(item, currentQty);
                            }).join("")}
                        </div>
                    </section>
                `;
            }).join("");

            attachButtonHandlers();
        }

        renderCategoryCards();
        renderFilters();
        renderCatalog();
        window.updateCatalogButtons = updateAllButtons;
    })
    .catch(err => {
        console.error("Ошибка загрузки каталога:", err);
        document.getElementById("catalog").innerHTML =
            '<p style="text-align:center; color:#888; padding:60px 20px;">Не удалось загрузить товары...</p>';
    });
