package qa.support;

import io.restassured.RestAssured;
import org.junit.jupiter.api.Assumptions;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

public final class ApiTestConfig {
    private static final String DEFAULT_BASE_URL = "http://localhost:3000";

    private ApiTestConfig() {
    }

    public static String baseUrl() {
        String fromSystemProperty = System.getProperty("baseUrl");
        String fromEnvironment = System.getenv("BASE_URL");

        if (fromSystemProperty != null && !fromSystemProperty.isBlank()) {
            return removeTrailingSlash(fromSystemProperty);
        }
        if (fromEnvironment != null && !fromEnvironment.isBlank()) {
            return removeTrailingSlash(fromEnvironment);
        }
        return DEFAULT_BASE_URL;
    }

    public static void configureRestAssured() {
        RestAssured.baseURI = baseUrl();
    }

    public static void requireAvailableApi() {
        Assumptions.assumeTrue(isApiAvailable(), "API недоступен: запустите приложение или передайте -DbaseUrl=https://...");
    }

    private static boolean isApiAvailable() {
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(baseUrl() + "/api/health"))
                .timeout(Duration.ofSeconds(3))
                .GET()
                .build();

            HttpResponse<String> response = HttpClient.newHttpClient()
                .send(request, HttpResponse.BodyHandlers.ofString());

            return response.statusCode() == 200 && response.body().contains("\"ok\":true");
        } catch (Exception ignored) {
            return false;
        }
    }

    private static String removeTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
