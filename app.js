fetch("catalog.json")
    .then(res => res.json())
    .then(items => {
        const catalog = document.getElementById("catalog");

        items.forEach(item => {
            const stockText = item.stock > 0
                ? `<span class="stock available">В наличии: ${item.stock} шт.</span>`
                : `<span class="stock unavailable">Нет в наличии</span>`;

            const buttonText = item.stock > 0 ? "В корзину" : "Нет в наличии";
            const buttonDisabled = item.stock === 0 ? "disabled" : "";

            catalog.innerHTML += `
        <div class="card">
          <img src="${item.image}" alt="${item.title}">
          <h3>${item.title}</h3>
          <strong>${item.price.toLocaleString()} ₽</strong>
          <p>${item.description}</p>
          ${stockText}
          <button onclick='addToCart(${JSON.stringify(item)})' ${buttonDisabled}>
            ${buttonText}
          </button>
        </div>
      `;
        });
    });