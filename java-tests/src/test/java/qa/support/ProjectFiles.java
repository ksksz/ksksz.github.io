package qa.support;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

public final class ProjectFiles {
    private ProjectFiles() {
    }

    public static Path projectRoot() {
        return Path.of("..").toAbsolutePath().normalize();
    }

    public static String readProjectFile(String fileName) {
        try {
            return Files.readString(projectRoot().resolve(fileName), StandardCharsets.UTF_8);
        } catch (IOException error) {
            throw new AssertionError("Не удалось прочитать файл проекта: " + fileName, error);
        }
    }
}
