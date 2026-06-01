package qa.api;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import qa.support.ApiTestConfig;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.notNullValue;

@DisplayName("Валидация оформления заказа через API")
class OrderValidationApiTest {

    @BeforeEach
    void setUp() {
        ApiTestConfig.configureRestAssured();
        ApiTestConfig.requireAvailableApi();
    }

    @Test
    @DisplayName("POST /api/orders отклоняет заказ без имени и телефона")
    void orderRequiresCustomerNameAndPhone() {
        given()
            .contentType("application/json")
            .body("""
                {
                  "name": "",
                  "phone": "",
                  "delivery": "pickup",
                  "items": [{"id": 1, "qty": 1}]
                }
                """)
            .when()
            .post("/api/orders")
            .then()
            .statusCode(400)
            .body("error", containsString("Заполните имя и телефон"));
    }

    @Test
    @DisplayName("POST /api/orders отклоняет неизвестный способ доставки")
    void orderRejectsUnknownDeliveryType() {
        given()
            .contentType("application/json")
            .body("""
                {
                  "name": "QA Tester",
                  "phone": "+7 900 000-00-00",
                  "delivery": "unknown_delivery",
                  "items": [{"id": 1, "qty": 1}]
                }
                """)
            .when()
            .post("/api/orders")
            .then()
            .statusCode(400)
            .body("error", containsString("Некорректный способ получения"));
    }

    @Test
    @DisplayName("POST /api/orders отклоняет пустую корзину")
    void orderRejectsEmptyCart() {
        given()
            .contentType("application/json")
            .body("""
                {
                  "name": "QA Tester",
                  "phone": "+7 900 000-00-00",
                  "delivery": "pickup",
                  "items": []
                }
                """)
            .when()
            .post("/api/orders")
            .then()
            .statusCode(400)
            .body("error", containsString("Корзина пуста"));
    }

    @Test
    @DisplayName("POST /api/orders возвращает понятную ошибку для несуществующего товара")
    void orderRejectsUnknownProduct() {
        given()
            .contentType("application/json")
            .body("""
                {
                  "name": "QA Tester",
                  "phone": "+7 900 000-00-00",
                  "delivery": "pickup",
                  "items": [{"id": 999999, "qty": 1}]
                }
                """)
            .when()
            .post("/api/orders")
            .then()
            .statusCode(400)
            .body("error", notNullValue());
    }
}
