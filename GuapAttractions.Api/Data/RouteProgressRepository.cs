using System.Data;
using System.Text.Json;
using GuapAttractions.Api.Models;
using Microsoft.Data.SqlClient;

namespace GuapAttractions.Api.Data;

public class RouteProgressRepository
{
    private readonly SqlConnectionFactory _connectionFactory;

    public RouteProgressRepository(SqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<RouteProgressDto?> GetProgressAsync(int userId, int routeId, CancellationToken ct)
    {
        // Чтение прогресса — простой выбор по индексам IX_прогресс_*; SP не требуется.
        const string sqlProgress = """
            SELECT TOP 1
                [id_маршрута]                     AS RouteId,
                [id_последней_пройденной_точки]   AS LastPointId,
                [завершен]                        AS Completed
            FROM [прогресс_маршрута]
            WHERE [id_маршрута] = @routeId AND [id_пользователя] = @userId;
            """;

        const string sqlExcluded = """
            SELECT [id_достопримечательности] AS AttractionId
            FROM [исключенная_точка]
            WHERE [id_маршрута] = @routeId AND [id_пользователя] = @userId;
            """;

        await using var conn = _connectionFactory.CreateConnection();
        await conn.OpenAsync(ct);

        int? lastPointId = null;
        var completed = false;

        await using (var cmd = new SqlCommand(sqlProgress, conn))
        {
            cmd.Parameters.AddWithValue("@routeId", routeId);
            cmd.Parameters.AddWithValue("@userId", userId);

            await using var reader = await cmd.ExecuteReaderAsync(ct);
            if (await reader.ReadAsync(ct))
            {
                if (!reader.IsDBNull(reader.GetOrdinal("LastPointId")))
                    lastPointId = reader.GetInt32(reader.GetOrdinal("LastPointId"));
                if (!reader.IsDBNull(reader.GetOrdinal("Completed")))
                    completed = reader.GetBoolean(reader.GetOrdinal("Completed"));
            }
        }

        var excluded = new List<int>();
        await using (var cmd = new SqlCommand(sqlExcluded, conn))
        {
            cmd.Parameters.AddWithValue("@routeId", routeId);
            cmd.Parameters.AddWithValue("@userId", userId);

            await using var reader = await cmd.ExecuteReaderAsync(ct);
            while (await reader.ReadAsync(ct))
            {
                excluded.Add(reader.GetInt32(reader.GetOrdinal("AttractionId")));
            }
        }

        if (lastPointId is null && excluded.Count == 0 && !completed)
            return null;

        return new RouteProgressDto(routeId, lastPointId, excluded, completed);
    }

    public async Task SaveProgressAsync(int userId, int routeId, int lastPointId, IReadOnlyList<int> excludedAttractionIds, CancellationToken ct)
    {
        var excludedJson = JsonSerializer.Serialize(excludedAttractionIds);

        await using var conn = _connectionFactory.CreateConnection();
        await conn.OpenAsync(ct);

        await using var cmd = new SqlCommand("[dbo].[ПрогрессМаршрута_Сохранить]", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.Add(new SqlParameter("@id_пользователя", SqlDbType.Int) { Value = userId });
        cmd.Parameters.Add(new SqlParameter("@id_маршрута", SqlDbType.Int) { Value = routeId });
        cmd.Parameters.Add(new SqlParameter("@id_последней_пройденной_точки", SqlDbType.Int) { Value = lastPointId });
        cmd.Parameters.Add(new SqlParameter("@исключенные_json", SqlDbType.NVarChar, -1) { Value = excludedJson });

        await cmd.ExecuteNonQueryAsync(ct);
    }

    public async Task ResetProgressAsync(int userId, int routeId, CancellationToken ct)
    {
        await using var conn = _connectionFactory.CreateConnection();
        await conn.OpenAsync(ct);

        await using var cmd = new SqlCommand("[dbo].[ПрогрессМаршрута_Сбросить]", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.Add(new SqlParameter("@id_пользователя", SqlDbType.Int) { Value = userId });
        cmd.Parameters.Add(new SqlParameter("@id_маршрута", SqlDbType.Int) { Value = routeId });

        await cmd.ExecuteNonQueryAsync(ct);
    }

    public async Task MarkCompletedAsync(int userId, int routeId, int lastPointId, CancellationToken ct)
    {
        await using var conn = _connectionFactory.CreateConnection();
        await conn.OpenAsync(ct);

        await using var cmd = new SqlCommand("[dbo].[ПрогрессМаршрута_ЗавершитьМаршрут]", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.Add(new SqlParameter("@id_пользователя", SqlDbType.Int) { Value = userId });
        cmd.Parameters.Add(new SqlParameter("@id_маршрута", SqlDbType.Int) { Value = routeId });
        cmd.Parameters.Add(new SqlParameter("@id_последней_пройденной_точки", SqlDbType.Int) { Value = lastPointId });

        await cmd.ExecuteNonQueryAsync(ct);
    }
}
