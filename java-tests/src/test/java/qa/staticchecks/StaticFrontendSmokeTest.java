package qa.staticchecks;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import qa.support.ProjectFiles;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DisplayName("Статическая проверка клиентских HTML-страниц")
class StaticFrontendSmokeTest {

    @Test
    @DisplayName("Главная страница содержит витрину, каталог, корзину и нужные скрипты")
    void indexPageContainsStorefrontElements() {
        String html = ProjectFiles.readProjectFile("index.html");

        assertAll(
            () -> assertTrue(html.contains("id=\"category-cards\""), "На главной должен быть контейнер категорий"),
            () -> assertTrue(html.contains("id=\"catalog-filters\""), "На главной должны быть фильтры каталога"),
            () -> assertTrue(html.contains("id=\"catalog\""), "На главной должен быть контейнер каталога"),
            () -> assertTrue(html.contains("checkout.html"), "На главной должна быть ссылка на оформление заказа"),
            () -> assertTrue(html.contains("cart.js"), "Корзина должна подключаться на главной"),
            () -> assertTrue(html.contains("app.js"), "Каталог должен подключаться на главной")
        );
    }

    @Test
    @DisplayName("Страница оформления заказа содержит поля клиента и способы получения")
    void checkoutPageContainsRequiredOrderFields() {
        String html = ProjectFiles.readProjectFile("checkout.html");

        assertAll(
            () -> assertTrue(html.contains("id=\"name\""), "Форма должна содержать поле имени"),
            () -> assertTrue(html.contains("id=\"phone\""), "Форма должна содержать поле телефона"),
            () -> assertTrue(html.contains("tomsk_delivery"), "Должна быть доставка по Томску"),
            () -> assertTrue(html.contains("seversk_delivery"), "Должна быть доставка по Северску"),
            () -> assertTrue(html.contains("pickup"), "Должен быть самовывоз"),
            () -> assertTrue(html.contains("checkout.js"), "Логика оформления должна быть подключена")
        );
    }

    @Test
    @DisplayName("Админская страница содержит основные разделы управления магазином")
    void adminPageContainsManagementSections() {
        String html = ProjectFiles.readProjectFile("admin.html");

        assertAll(
            () -> assertTrue(html.contains("id=\"login-panel\""), "Должна быть форма входа администратора"),
            () -> assertTrue(html.contains("id=\"password\""), "Должно быть поле пароля администратора"),
            () -> assertTrue(html.contains("products"), "Должен быть раздел товаров"),
            () -> assertTrue(html.contains("categories"), "Должен быть раздел категорий"),
            () -> assertTrue(html.contains("/api/admin/products"), "Админка должна работать с товарами через API"),
            () -> assertTrue(html.contains("/api/admin/categories"), "Админка должна работать с категориями через API")
        );
    }
}
