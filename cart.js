let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartBadge();
}

function addToCart(item) {
    const found = cart.find(i => i.id === item.id);

    if (found) {
        found.qty += 1;
    } else {
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
    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
        cart.splice(index, 1);
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
