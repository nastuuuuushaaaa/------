using System.Data;
using GuapAttractions.Api.Models;
using Microsoft.Data.SqlClient;

namespace GuapAttractions.Api.Data;

public class RoutesRepository
{
    private readonly SqlConnectionFactory _connectionFactory;

    public RoutesRepository(SqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IReadOnlyList<RouteSummaryDto>> GetRoutesAsync(CancellationToken cancellationToken)
    {
        await using SqlConnection connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);

        await using var cmd = new SqlCommand("[dbo].[Маршрут_Список]", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);

        var result = new List<RouteSummaryDto>();
        while (await reader.ReadAsync(cancellationToken))
        {
            result.Add(new RouteSummaryDto(
                Id: reader.GetInt32(reader.GetOrdinal("Id")),
                Title: reader.GetString(reader.GetOrdinal("Title")),
                Description: reader.IsDBNull(reader.GetOrdinal("Description")) ? null : reader.GetString(reader.GetOrdinal("Description")),
                Direction: reader.GetString(reader.GetOrdinal("Direction")),
                ImageUrl: reader.IsDBNull(reader.GetOrdinal("ImageUrl")) ? null : reader.GetString(reader.GetOrdinal("ImageUrl")),
                PointsCount: reader.GetInt32(reader.GetOrdinal("PointsCount")),
                DurationMinutes: reader.GetInt32(reader.GetOrdinal("DurationMinutes"))
            ));
        }

        return result;
    }

    public async Task<RouteDetailDto?> GetRouteByIdAsync(int routeId, CancellationToken cancellationToken)
    {
        await using SqlConnection connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);

        await using var cmd = new SqlCommand("[dbo].[Маршрут_Детали]", connection)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.Add(new SqlParameter("@id_маршрута", SqlDbType.Int) { Value = routeId });

        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);

        // 1) Карточка маршрута. Если её нет — маршрут не существует.
        int? id = null;
        string? title = null;
        string? description = null;
        string? direction = null;
        string? imageUrl = null;

        if (await reader.ReadAsync(cancellationToken))
        {
            id = reader.GetInt32(reader.GetOrdinal("Id"));
            title = reader.GetString(reader.GetOrdinal("Title"));
            description = reader.IsDBNull(reader.GetOrdinal("Description")) ? null : reader.GetString(reader.GetOrdinal("Description"));
            direction = reader.GetString(reader.GetOrdinal("Direction"));
            imageUrl = reader.IsDBNull(reader.GetOrdinal("ImageUrl")) ? null : reader.GetString(reader.GetOrdinal("ImageUrl"));
        }

        if (id is null || title is null || direction is null)
            return null;

        // 2) Точки маршрута с достопримечательностями.
        var rawPoints = new List<(int PointId, int Order, int Minutes, AttractionDto Attraction)>();
        var totalMinutes = 0;

        await reader.NextResultAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var minutesForPoint = reader.GetInt32(reader.GetOrdinal("MinutesForPoint"));
            totalMinutes += minutesForPoint;

            var attraction = new AttractionDto(
                Id: reader.GetInt32(reader.GetOrdinal("AttractionId")),
                Title: reader.GetString(reader.GetOrdinal("AttractionTitle")),
                Address: reader.IsDBNull(reader.GetOrdinal("AttractionAddress")) ? null : reader.GetString(reader.GetOrdinal("AttractionAddress")),
                Description: reader.IsDBNull(reader.GetOrdinal("AttractionDescription")) ? null : reader.GetString(reader.GetOrdinal("AttractionDescription")),
                AudioUrl: reader.IsDBNull(reader.GetOrdinal("AttractionAudioUrl")) ? null : reader.GetString(reader.GetOrdinal("AttractionAudioUrl"))
            );

            rawPoints.Add((
                reader.GetInt32(reader.GetOrdinal("PointId")),
                reader.GetInt32(reader.GetOrdinal("Order")),
                minutesForPoint,
                attraction
            ));
        }

        // Сохраняем прежнее поведение: маршрут без точек считаем «не найден».
        if (rawPoints.Count == 0)
            return null;

        // 3) Фотографии всех точек маршрута.
        var photosByPoint = new Dictionary<int, List<string>>();

        await reader.NextResultAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            var pid = reader.GetInt32(reader.GetOrdinal("PointId"));
            var url = reader.GetString(reader.GetOrdinal("ImageUrl"));
            if (!photosByPoint.TryGetValue(pid, out var list))
            {
                list = new List<string>();
                photosByPoint[pid] = list;
            }

            list.Add(url);
        }

        var points = new List<RoutePointDto>(rawPoints.Count);
        foreach (var rp in rawPoints)
        {
            var urls = photosByPoint.TryGetValue(rp.PointId, out var fromDb) && fromDb.Count > 0
                ? (IReadOnlyList<string>)fromDb
                : Array.Empty<string>();

            points.Add(new RoutePointDto(
                PointId: rp.PointId,
                Order: rp.Order,
                MinutesForPoint: rp.Minutes,
                Attraction: rp.Attraction,
                ImageUrls: urls
            ));
        }

        return new RouteDetailDto(
            Id: id.Value,
            Title: title,
            Description: description,
            Direction: direction,
            ImageUrl: imageUrl,
            PointsCount: points.Count,
            DurationMinutes: totalMinutes,
            Points: points
        );
    }
}
