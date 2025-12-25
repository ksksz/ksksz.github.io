fetch("catalog.json")
    .then(res => res.json())
    .then(originalItems => {
        let items = originalItems;

        // Если есть сохранённые актуальные остатки — используем их
        const savedStock = localStorage.getItem("catalogStock");
        if (savedStock) {
            try {
                const parsedStock = JSON.parse(savedStock);
                items = originalItems.map(item => {
                    const saved = parsedStock.find(s => s.id === item.id);
                    return saved ? { ...item, stock: saved.stock } : item;
                });
            } catch (e) {
                console.warn("Повреждённые данные catalogStock в localStorage", e);
            }
        }

        const catalog = document.getElementById("catalog");

        function updateAllButtons() {
            const containers = document.querySelectorAll(".card .qty-container");
            containers.forEach(container => {
                const itemId = parseInt(container.dataset.id);
                const cartItem = cart.find(i => i.id === itemId);
                const qty = cartItem ? cartItem.qty : 0;

                const item = items.find(i => i.id === itemId);
                const inStock = item && item.stock > 0;

                if (!inStock) {
                    // Просто надпись "Нет в наличии" без кнопки
                    container.innerHTML = `
                        <div class="out-of-stock-label">Нет в наличии</div>
                    `;
                    return;
                }

                if (qty === 0) {
                    container.innerHTML = `
                        <button class="add-to-cart-btn" data-id="${itemId}">
                            В корзину
                        </button>
                    `;
                } else {
                    container.innerHTML = `
                        <div class="qty-control-inline">
                            <button class="qty-btn-inline qty-minus" data-id="${itemId}">−</button>
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

        // Генерация карточек
        items.forEach(item => {
            // Убрали отдельный блок с "Нет в наличии" над кнопкой — теперь только в qty-container
            const currentQty = cart.find(i => i.id === item.id)?.qty || 0;

            catalog.innerHTML += `
        <div class="card">
          <img src="${item.image}" alt="${item.title}">
          <h3>${item.title}</h3>
          <strong>${item.price.toLocaleString()} ₽</strong>
          <p>${item.description}</p>
          <div class="qty-container" data-id="${item.id}">
            ${item.stock > 0 ? (
                currentQty > 0 ? `
              <div class="qty-control-inline">
                <button class="qty-btn-inline qty-minus" data-id="${item.id}">−</button>
                <span class="qty-display-inline">${currentQty}</span>
                <button class="qty-btn-inline qty-plus" data-id="${item.id}">+</button>
              </div>
            ` : `
              <button class="add-to-cart-btn" data-id="${item.id}">
                В корзину
              </button>
            `
            ) : `
              <div class="out-of-stock-label">Нет в наличии</div>
            `}
          </div>
        </div>
      `;
        });

        attachButtonHandlers();
        window.updateCatalogButtons = updateAllButtons;
    })
    .catch(err => {
        console.error("Ошибка загрузки каталога:", err);
        document.getElementById("catalog").innerHTML =
            '<p style="text-align:center; color:#888; padding:60px 20px;">Не удалось загрузить товары...</p>';
    });