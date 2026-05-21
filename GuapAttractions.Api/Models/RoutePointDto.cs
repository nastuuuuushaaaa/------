namespace GuapAttractions.Api.Models;

public record RoutePointDto(
    int PointId,
    int Order,
    int MinutesForPoint,
    AttractionDto Attraction,
    IReadOnlyList<string> ImageUrls
);

