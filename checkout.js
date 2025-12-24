const BOT_TOKEN = "8580777195:AAHCLZvYy58ybfNZlWfoN_L7GBzhtuRFbQI"; // ← ОБЯЗАТЕЛЬНО замени!
const CHAT_ID = "427675942";     // ← ОБЯЗАТЕЛЬНО замени!

const cartDiv = document.getElementById("cart");
const totalDiv = document.getElementById("total");

let catalogData = [];

// Загружаем сохранённые остатки, если есть
const savedStock = localStorage.getItem("catalogStock");
if (savedStock) {
    catalogData = JSON.parse(savedStock);
} else {
    fetch("catalog.json")
        .then(res => res.json())
        .then(data => {
            catalogData = data;
            localStorage.setItem("catalogStock", JSON.stringify(catalogData));
        })
        .catch(err => console.error("Не удалось загрузить catalog.json", err));
}

function renderCart() {
    cartDiv.innerHTML = "";
    let total = 0;

    if (!cart.length) {
        cartDiv.innerHTML = `<p class="empty-cart">Корзина пуста</p>`;
        totalDiv.innerHTML = "";
        return;
    }

    cart.forEach((item, index) => {
        const sum = item.qty * item.price;
        total += sum;

        const catalogItem = catalogData.find(i => i.id === item.id);
        const stockInfo = catalogItem
            ? (catalogItem.stock > 0
                ? `<small style="color:#777; display:block; margin-top:4px;">Осталось: ${catalogItem.stock} шт.</small>`
                : `<small style="color:#ff6b9d; display:block; margin-top:4px; font-weight:600;">Нет в наличии</small>`)
            : `<small style="color:#888;">Данные о наличии отсутствуют</small>`;

        cartDiv.innerHTML += `
      <div class="cart-item">
        <div class="cart-info">
          <h4>${item.title}${stockInfo}</h4>
          <div class="cart-price">
            ${item.price.toLocaleString()} ₽ × ${item.qty} = ${sum.toLocaleString()} ₽
          </div>
        </div>

        <div class="cart-actions">
          <div class="qty-control">
            <button class="qty-btn" onclick="changeQty(${index}, -1)">−</button>
            <span class="qty">${item.qty}</span>
            <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
          </div>
          <button class="remove-btn" onclick="removeItem(${index})" title="Удалить">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    `;
    });

    totalDiv.innerHTML = `<h3>Итого: <strong>${total.toLocaleString()} ₽</strong></h3>`;
}

function sendOrder() {
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const comment = document.getElementById("comment").value.trim();

    if (!name || !phone) {
        showToast("Заполните имя и телефон ⚠️");
        return;
    }

    if (cart.length === 0) {
        showToast("Корзина пуста!");
        return;
    }

    // Проверка остатков перед отправкой
    for (const cartItem of cart) {
        const catalogItem = catalogData.find(c => c.id === cartItem.id);
        if (!catalogItem || catalogItem.stock < cartItem.qty) {
            showToast(`Недостаточно товара "${cartItem.title}" в наличии!`);
            return;
        }
    }

    let message = "🛒 *Новый заказ!*\n\n";
    let total = 0;

    cart.forEach(item => {
        const sum = item.qty * item.price;
        total += sum;
        message += `• ${item.title} × ${item.qty} — ${sum.toLocaleString()} ₽\n`;
    });

    message += `\n💰 *Итого: ${total.toLocaleString()} ₽*`;
    message += `\n\n👤 *Имя:* ${name}`;
    message += `\n📞 *Телефон:* ${phone}`;
    if (comment) message += `\n💬 *Комментарий:* ${comment}`;

    fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: CHAT_ID,
            text: message,
            parse_mode: "Markdown"
        })
    })
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                showToast("Заказ отправлен! Спасибо ❤️");

                // Уменьшаем остаток
                cart.forEach(cartItem => {
                    const catalogItem = catalogData.find(c => c.id === cartItem.id);
                    if (catalogItem) {
                        catalogItem.stock = Math.max(0, catalogItem.stock - cartItem.qty);
                    }
                });

                // Сохраняем актуальные остатки
                localStorage.setItem("catalogStock", JSON.stringify(catalogData));

                // Очищаем корзину
                localStorage.removeItem("cart");
                cart = [];

                renderCart();
                updateCartBadge();

                // Можно добавить небольшую задержку перед переходом обратно
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 1800);
            } else {
                showToast("Ошибка отправки. Попробуйте позже ❌");
            }
        })
        .catch(() => {
            showToast("Нет интернета или ошибка сервера ❌");
        });
}

renderCart();