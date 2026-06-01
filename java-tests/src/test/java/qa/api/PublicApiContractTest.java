package qa.api;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import qa.support.ApiTestConfig;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasKey;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;

@DisplayName("Контракт публичного API")
class PublicApiContractTest {

    @BeforeEach
    void setUp() {
        ApiTestConfig.configureRestAssured();
        ApiTestConfig.requireAvailableApi();
    }

    @Test
    @DisplayName("GET /api/health возвращает ok=true")
    void healthEndpointReturnsOk() {
        given()
            .when()
            .get("/api/health")
            .then()
            .statusCode(200)
            .body("ok", is(true));
    }

    @Test
    @DisplayName("GET /api/products возвращает массив товаров с ожидаемыми полями")
    void productsEndpointReturnsExpectedFields() {
        given()
            .when()
            .get("/api/products")
            .then()
            .statusCode(200)
            .body("$", notNullValue())
            .body("findAll { it != null }", everyItem(hasKey("id")))
            .body("findAll { it != null }", everyItem(hasKey("title")))
            .body("findAll { it != null }", everyItem(hasKey("price")))
            .body("findAll { it != null }", everyItem(hasKey("stock")))
            .body("findAll { it != null }", everyItem(hasKey("category")));
    }

    @Test
    @DisplayName("GET /api/categories возвращает массив категорий с ожидаемыми полями")
    void categoriesEndpointReturnsExpectedFields() {
        given()
            .when()
            .get("/api/categories")
            .then()
            .statusCode(200)
            .body("$", notNullValue())
            .body("findAll { it != null }", everyItem(hasKey("id")))
            .body("findAll { it != null }", everyItem(hasKey("name")))
            .body("findAll { it != null }", everyItem(hasKey("sortOrder")))
            .body("findAll { it != null }", everyItem(hasKey("isActive")));
    }
}
