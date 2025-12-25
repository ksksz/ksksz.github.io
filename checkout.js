const BOT_TOKEN = "TELEGRAM_TOKEN_REMOVED"; // ← ОБЯЗАТЕЛЬНО замените!
const CHAT_ID = "427675942";                                         // ← ОБЯЗАТЕЛЬНО замените!

const cartDiv = document.getElementById("cart");
const totalDiv = document.getElementById("total");

let catalogData = [];

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
        .catch(err => console.error("Ошибка загрузки catalog.json:", err));
}

const DELIVERY_OPTIONS = {
    "tomsk_delivery": {
        name: "Доставка по Томску",
        price: 150
    },
    "seversk_delivery": {
        name: "Доставка по Северску",
        price: 200
    },
    "pickup": {
        name: "Самовывоз",
        price: 0,
        address: "г. Томск, ул. Мира, 48"
    }
};

let selectedOption = "tomsk_delivery";

function calculateSubtotal() {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function calculateTotal() {
    const option = DELIVERY_OPTIONS[selectedOption];
    return calculateSubtotal() + (option ? option.price : 0);
}

function renderCart() {
    cartDiv.innerHTML = "";
    const subtotal = calculateSubtotal();

    if (!cart.length) {
        cartDiv.innerHTML = `<p class="empty-cart">Корзина пуста</p>`;
        totalDiv.innerHTML = "";
        return;
    }

    cart.forEach((item, index) => {
        const itemSum = item.qty * item.price;
        const catalogItem = catalogData.find(i => i.id === item.id);

        // Показываем "Нет в наличии" только если stock === 0
        const stockInfo = catalogItem
            ? (catalogItem.stock > 0
                ? ''
                : `<small style="color:#ff6b9d; display:block; margin-top:4px; font-weight:600;">Нет в наличии</small>`)
            : `<small style="color:#888;">Данные о наличии отсутствуют</small>`;

        cartDiv.innerHTML += `
      <div class="cart-item">
        <div class="cart-info">
          <h4>${item.title}${stockInfo}</h4>
          <div class="cart-price">
            ${item.price.toLocaleString()} ₽ × ${item.qty} = ${itemSum.toLocaleString()} ₽
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

    const option = DELIVERY_OPTIONS[selectedOption];
    const deliveryCost = option ? option.price : 0;
    const total = subtotal + deliveryCost;

    totalDiv.innerHTML = `
      <div style="margin-bottom:10px; font-size:16px; color:#555;">
        Сумма товаров: ${subtotal.toLocaleString()} ₽
      </div>
      <div style="margin-bottom:12px; font-size:16px; color:#555;">
        ${option.name}: ${deliveryCost.toLocaleString()} ₽
        ${option.address ? `<br><small style="color:#666; font-size:14px;">${option.address}</small>` : ''}
      </div>
      <h3 style="margin-top:8px;">Итого: <strong>${total.toLocaleString()} ₽</strong></h3>
    `;
}

function updateTotal() {
    renderCart();
}

document.querySelectorAll('input[name="delivery"]').forEach(radio => {
    radio.addEventListener('change', function() {
        selectedOption = this.value;
        updateTotal();
    });
});

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

    // Убрана проверка остатков — можно заказывать любое количество

    const option = DELIVERY_OPTIONS[selectedOption];
    const deliveryCost = option.price;
    const deliveryText = option.address
        ? `${option.name} (адрес: ${option.address})`
        : option.name;

    let message = "🛒 *Новый заказ!*\n\n";
    let subtotal = 0;

    cart.forEach(item => {
        const itemSum = item.qty * item.price;
        subtotal += itemSum;
        message += `• ${item.title} × ${item.qty} — ${itemSum.toLocaleString()} ₽\n`;
    });

    message += `\nПолучение: ${deliveryText} — ${deliveryCost.toLocaleString()} ₽`;
    message += `\n\n💰 *Итого: ${(subtotal + deliveryCost).toLocaleString()} ₽*`;
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

                // Не уменьшаем остатки, т.к. количества не считаем

                localStorage.removeItem("cart");
                cart = [];

                renderCart();
                updateCartBadge();

                setTimeout(() => {
                    window.location.href = "index.html";
                }, 1800);
            } else {
                showToast("Ошибка отправки заказа ❌");
            }
        })
        .catch(() => {
            showToast("Ошибка соединения ❌");
        });
}

renderCart();