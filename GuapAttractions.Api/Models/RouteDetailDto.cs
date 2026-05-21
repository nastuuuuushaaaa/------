namespace GuapAttractions.Api.Models;

public record RouteDetailDto(
    int Id,
    string Title,
    string? Description,
    string Direction,
    string? ImageUrl,
    int PointsCount,
    int DurationMinutes,
    IReadOnlyList<RoutePointDto> Points
);

