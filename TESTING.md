# Java QA Tests

В проекте набор тестов для QA automation: Java, Maven, JUnit 5 и RestAssured. Приложение написано на JavaScript/Node.js, а Java-тесты проверяют его как внешний пользователь: через HTTP API и статические smoke-проверки файлов.

## Запуск

Из корня проекта:

```bash
cd java-tests
mvn test
```

Если команда `java` не находится, но Maven видит OpenJDK, можно запустить так:

```bash
cd java-tests
JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home mvn test
```

## Проверка Локального Или Опубликованного Сайта

По умолчанию API-тесты смотрят на:

```text
http://localhost:3000
```

Для Render или другого окружения:

```bash
cd java-tests
mvn test -DbaseUrl=https://your-service.onrender.com
```

Также можно передать адрес через переменную окружения:

```bash
cd java-tests
BASE_URL=https://your-service.onrender.com mvn test
```

Если API недоступен или `/api/health` не отвечает `ok=true`, API-тесты будут пропущены. Офлайн-тесты HTML и `render.yaml` все равно выполнятся.

## Что Покрыто

- `qa.staticchecks.StaticFrontendSmokeTest` — проверяет основные HTML-страницы и критичные элементы витрины, оформления заказа и админки.
- `qa.staticchecks.RenderDeploymentConfigTest` — проверяет конфигурацию деплоя Render: Node-сервис, команды сборки/запуска, health check и секреты.
- `qa.api.PublicApiContractTest` — проверяет контракт публичных API: `/api/health`, `/api/products`, `/api/categories`.
- `qa.api.OrderValidationApiTest` — проверяет негативные сценарии оформления заказа: пустые контакты, неизвестная доставка, пустая корзина, несуществующий товар.

## Особенности

- Офлайн smoke-тесты запускаются без поднятого сервера
- API-тесты смотрят на `http://localhost:3000` по умолчанию или на адрес из `-DbaseUrl`
- Если API недоступен, API-тесты корректно пропускаются, а офлайн-проверки продолжают выполняться
