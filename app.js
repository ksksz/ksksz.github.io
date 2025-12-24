fetch("catalog.json")
    .then(res => res.json())
    .then(items => {
        const catalog = document.getElementById("catalog");

        items.forEach(item => {
            catalog.innerHTML += `
        <div class="card">
          <img src="${item.image}">
          <h3>${item.title}</h3>
          <strong>${item.price} ₽</strong>
          <p>${item.description}</p>
          <button onclick='addToCart(${JSON.stringify(item)})'>
            В корзину
          </button>
        </div>
      `;
        });
    });
