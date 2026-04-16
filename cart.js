let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartBadge();

    // Обновляем кнопки в каталоге (на index.html)
    if (typeof window.updateCatalogButtons === "function") {
        window.updateCatalogButtons();
    }
}

function addToCart(item) {
    if (item.stock === 0) {
        showToast("Товара нет в наличии");
        return;
    }

    const found = cart.find(i => i.id === item.id);

    if (found) {
        if (found.qty >= item.stock) {
            showToast("В корзине уже весь доступный остаток");
            return;
        }
        found.qty += 1;
    } else {
        cart.push({ ...item, qty: 1 });
    }

    saveCart();
    showToast("Товар добавлен в корзину");
}

function getCartTotalItems() {
    return cart.reduce((sum, item) => sum + item.qty, 0);
}

function updateCartBadge() {
    const badgeElements = document.querySelectorAll(".cart-badge");
    const totalItems = getCartTotalItems();

    badgeElements.forEach(badge => {
        if (totalItems > 0) {
            badge.textContent = totalItems;
            badge.style.display = "flex";
        } else {
            badge.style.display = "none";
        }
    });
}

function changeQty(index, delta) {
    const item = cart[index];
    const newQty = item.qty + delta;

    if (newQty <= 0) {
        cart.splice(index, 1);
    } else if (item.stock && newQty > item.stock) {
        showToast("Нельзя добавить больше, чем есть в наличии");
        return;
    } else {
        item.qty = newQty;
    }
    saveCart();
}

function removeItem(index) {
    cart.splice(index, 1);
    saveCart();
}

document.addEventListener("DOMContentLoaded", () => {
    updateCartBadge();

    if (typeof window.updateCatalogButtons === "function") {
        window.updateCatalogButtons();
    }
});
