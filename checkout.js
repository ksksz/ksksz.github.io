const cartDiv = document.getElementById("cart");
const totalDiv = document.getElementById("total");
const submitButton = document.querySelector(".submit-btn");

let catalogData = [];

async function loadCatalog() {
    const res = await fetch("/api/products");
    if (!res.ok) throw new Error("API недоступен");
    return await res.json();
}

loadCatalog()
    .then(data => {
        catalogData = data;
        renderCart();
    })
    .catch(err => {
        console.error("Ошибка загрузки каталога:", err);
        showToast("Не удалось загрузить данные о товарах");
        catalogData = [];
        renderCart();
    });

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
        const stockInfo = catalogItem
            ? (catalogItem.stock > 0
                ? `<small class="cart-stock available">В наличии: ${catalogItem.stock}</small>`
                : `<small class="cart-stock unavailable">Нет в наличии</small>`)
            : `<small class="cart-stock">Данные о наличии отсутствуют</small>`;

        cartDiv.innerHTML += `
            <div class="cart-item">
                <div class="cart-info">
                    <h4>${item.title}${stockInfo}</h4>
                    <div class="cart-price">
                        ${item.price.toLocaleString("ru-RU")} ₽ x ${item.qty} = ${itemSum.toLocaleString("ru-RU")} ₽
                    </div>
                </div>

                <div class="cart-actions">
                    <div class="qty-control">
                        <button class="qty-btn" onclick="changeQty(${index}, -1); renderCart();">-</button>
                        <span class="qty">${item.qty}</span>
                        <button class="qty-btn" onclick="changeQty(${index}, 1); renderCart();">+</button>
                    </div>
                    <button class="remove-btn" onclick="removeItem(${index}); renderCart();" title="Удалить">
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
        <div class="total-line">
            Сумма товаров: ${subtotal.toLocaleString("ru-RU")} ₽
        </div>
        <div class="total-line">
            ${option.name}: ${deliveryCost.toLocaleString("ru-RU")} ₽
            ${option.address ? `<br><small>${option.address}</small>` : ""}
        </div>
        <h3>Итого: <strong>${total.toLocaleString("ru-RU")} ₽</strong></h3>
    `;
}

function updateTotal() {
    renderCart();
}

document.querySelectorAll('input[name="delivery"]').forEach(radio => {
    radio.addEventListener("change", function() {
        selectedOption = this.value;
        updateTotal();
    });
});

async function sendOrder() {
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const comment = document.getElementById("comment").value.trim();

    if (!name || !phone) {
        showToast("Заполните имя и телефон");
        return;
    }

    if (cart.length === 0) {
        showToast("Корзина пуста");
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Отправляем...";

    try {
        const res = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                phone,
                comment,
                delivery: selectedOption,
                items: cart.map(item => ({ id: item.id, qty: item.qty }))
            })
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            throw new Error(data.error || "Ошибка отправки заказа");
        }

        showToast("Заказ отправлен. Спасибо!");
        localStorage.removeItem("cart");
        cart = [];
        saveCart();
        renderCart();
        updateCartBadge();

        setTimeout(() => {
            window.location.href = "index.html";
        }, 1800);
    } catch (error) {
        showToast(error.message || "Ошибка соединения");
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Отправить заказ";
    }
}
