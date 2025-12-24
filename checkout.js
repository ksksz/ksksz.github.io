const BOT_TOKEN = "TELEGRAM_TOKEN_REMOVED";
const CHAT_ID = "427675942";

const cartDiv = document.getElementById("cart");
const totalDiv = document.getElementById("total");

// Функция отрисовки корзины
function renderCart() {
    cartDiv.innerHTML = "";
    let total = 0;

    // cart берётся из cart.js (глобальная переменная)
    if (!cart.length) {
        cartDiv.innerHTML = `<p class="empty-cart">Корзина пуста</p>`;
        totalDiv.innerHTML = "";
        return;
    }

    cart.forEach((item, index) => {
        const sum = item.qty * item.price;
        total += sum;

        cartDiv.innerHTML += `
      <div class="cart-item">
        <div class="cart-info">
          <h4>${item.title}</h4>
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
        alert("Пожалуйста, заполните имя и телефон");
        return;
    }

    if (cart.length === 0) {
        alert("Корзина пуста! Добавьте товары перед оформлением.");
        return;
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
    if (comment) {
        message += `\n💬 *Комментарий:* ${comment}`;
    }

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
                alert("Заказ успешно отправлен! Спасибо за покупку ❤️");
                localStorage.removeItem("cart");
                cart = []; // Очищаем глобальную корзину
                renderCart();
                updateCartBadge();
            } else {
                alert("Ошибка отправки. Попробуйте позже.");
            }
        })
        .catch(() => {
            alert("Ошибка сети. Проверьте подключение к интернету.");
        });
}

// Отрисовываем корзину сразу при загрузке страницы
renderCart();