namespace GuapAttractions.Api.Models;

public record AttractionDto(
    int Id,
    string Title,
    string? Address,
    string? Description,
    string? AudioUrl,
    int AudioDurationMinutes = 0
);

