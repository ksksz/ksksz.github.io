package qa.staticchecks;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import qa.support.ProjectFiles;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DisplayName("Проверка конфигурации Render")
class RenderDeploymentConfigTest {

    @Test
    @DisplayName("render.yaml описывает Node-сервис с health check и обязательными секретами")
    void renderYamlContainsProductionServiceSettings() {
        String yaml = ProjectFiles.readProjectFile("render.yaml");

        assertAll(
            () -> assertTrue(yaml.contains("type: web"), "Render должен создавать web service"),
            () -> assertTrue(yaml.contains("name: fish-berry-shop"), "Имя сервиса должно быть стабильным"),
            () -> assertTrue(yaml.contains("env: node"), "Сервис должен запускаться как Node.js"),
            () -> assertTrue(yaml.contains("buildCommand: npm install"), "На Render должна быть команда сборки"),
            () -> assertTrue(yaml.contains("startCommand: npm start"), "На Render должна быть команда запуска"),
            () -> assertTrue(yaml.contains("healthCheckPath: /api/health"), "Health check должен идти в API"),
            () -> assertTrue(yaml.contains("DATABASE_URL"), "Должна быть переменная подключения к БД"),
            () -> assertTrue(yaml.contains("ADMIN_PASSWORD"), "Должен быть секрет пароля администратора"),
            () -> assertTrue(yaml.contains("GOOGLE_PRIVATE_KEY"), "Должен быть секрет Google Sheets")
        );
    }
}
