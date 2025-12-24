let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartBadge(); // Обновляем бейджик на всех страницах
}

function addToCart(item) {
    const found = cart.find(i => i.id === item.id);

    if (found) {
        found.qty += 1;
    } else {
        cart.push({ ...item, qty: 1 });
    }

    saveCart();
    alert("Товар добавлен в корзину ✅");
}

// Подсчёт общего количества товаров в корзине
function getCartTotalItems() {
    return cart.reduce((sum, item) => sum + item.qty, 0);
}

// Обновление всех бейджиков с количеством товаров
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

// Обновляем бейджик при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
    updateCartBadge();
});