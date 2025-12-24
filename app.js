fetch("catalog.json")
    .then(res => res.json())
    .then(items => {
        const catalog = document.getElementById("catalog");

        // Функция обновления всех кнопок/контроллеров в каталоге
        function updateAllButtons() {
            const containers = document.querySelectorAll(".card .qty-container");
            containers.forEach(container => {
                const itemId = parseInt(container.dataset.id);
                const cartItem = cart.find(i => i.id === itemId);
                const qty = cartItem ? cartItem.qty : 0;

                const item = items.find(i => i.id === itemId);
                const inStock = item && item.stock > 0;

                const qtySpan = container.querySelector(".qty-display");
                const minusBtn = container.querySelector(".qty-minus");
                const plusBtn = container.querySelector(".qty-plus");
                const addBtn = container.querySelector(".add-to-cart-btn");

                if (!inStock) {
                    container.innerHTML = `
                        <button class="add-to-cart-btn disabled" disabled>
                            Нет в наличии
                        </button>
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

            // Назначаем обработчики после обновления DOM
            attachButtonHandlers();
        }

        // Назначение обработчиков кликов
        function attachButtonHandlers() {
            // Кнопка "В корзину"
            document.querySelectorAll(".add-to-cart-btn:not(.disabled)").forEach(btn => {
                btn.onclick = () => {
                    const itemId = parseInt(btn.dataset.id);
                    const item = items.find(i => i.id === itemId);
                    if (item) {
                        addToCart(item);
                        updateAllButtons();
                    }
                };
            });

            // Кнопка "+"
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

            // Кнопка "−"
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
            const stockText = item.stock > 0
                ? `<span class="stock available">В наличии: ${item.stock} шт.</span>`
                : `<span class="stock unavailable">Нет в наличии</span>`;

            const currentQty = cart.find(i => i.id === item.id)?.qty || 0;

            catalog.innerHTML += `
        <div class="card">
          <img src="${item.image}" alt="${item.title}">
          <h3>${item.title}</h3>
          <strong>${item.price.toLocaleString()} ₽</strong>
          <p>${item.description}</p>
          ${stockText}
          <div class="qty-container" data-id="${item.id}">
            ${currentQty > 0 && item.stock > 0 ? `
              <div class="qty-control-inline">
                <button class="qty-btn-inline qty-minus" data-id="${item.id}">−</button>
                <span class="qty-display-inline">${currentQty}</span>
                <button class="qty-btn-inline qty-plus" data-id="${item.id}">+</button>
              </div>
            ` : `
              <button class="add-to-cart-btn ${item.stock === 0 ? 'disabled' : ''}" 
                      ${item.stock === 0 ? 'disabled' : ''} 
                      data-id="${item.id}">
                ${item.stock === 0 ? 'Нет в наличии' : 'В корзину'}
              </button>
            `}
          </div>
        </div>
      `;
        });

        // Первичное назначение обработчиков
        attachButtonHandlers();

        // Делаем функцию обновления доступной для cart.js
        window.updateCatalogButtons = updateAllButtons;
    });