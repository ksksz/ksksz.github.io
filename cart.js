let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartBadge();
}

function addToCart(item) {
    if (item.stock === 0) {
        showToast("Товара нет в наличии 😔");
        return;
    }

    const found = cart.find(i => i.id === item.id);

    if (found) {
        if (found.qty + 1 > item.stock) {
            showToast(`В наличии только ${item.stock} шт.`);
            return;
        }
        found.qty += 1;
    } else {
        if (1 > item.stock) {
            showToast(`В наличии только ${item.stock} шт.`);
            return;
        }
        cart.push({ ...item, qty: 1 });
    }

    saveCart();
    showToast("Товар добавлен в корзину ✅");
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

    if (newQty > item.stock) {
        showToast(`В наличии только ${item.stock} шт.`);
        return;
    }

    if (newQty <= 0) {
        cart.splice(index, 1);
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
});