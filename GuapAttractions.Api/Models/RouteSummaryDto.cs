namespace GuapAttractions.Api.Models;

public record RouteSummaryDto(
    int Id,
    string Title,
    string? Description,
    string Direction,
    string? ImageUrl,
    int PointsCount,
    int DurationMinutes
);

