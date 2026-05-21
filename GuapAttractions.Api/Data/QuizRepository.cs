using System.Data;
using GuapAttractions.Api.Models;
using Microsoft.Data.SqlClient;

namespace GuapAttractions.Api.Data;

public class QuizRepository
{
    private readonly SqlConnectionFactory _connectionFactory;

    public QuizRepository(SqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<QuizDto?> GetQuizByRouteIdAsync(int routeId, CancellationToken ct)
    {
        await using var conn = _connectionFactory.CreateConnection();
        await conn.OpenAsync(ct);

        // SP возвращает 2 result-set'а (карточка + вопросы);
        // нам здесь нужна только карточка — второй result-set игнорируется при Dispose.
        await using var cmd = new SqlCommand("[dbo].[Викторина_ПоМаршруту]", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.Add(new SqlParameter("@id_маршрута", SqlDbType.Int) { Value = routeId });

        await using var reader = await cmd.ExecuteReaderAsync(ct);
        if (!await reader.ReadAsync(ct))
            return null;

        return new QuizDto(
            Id: reader.GetInt32(reader.GetOrdinal("Id")),
            RouteId: reader.GetInt32(reader.GetOrdinal("RouteId")),
            Title: reader.GetString(reader.GetOrdinal("Title")),
            Description: reader.IsDBNull(reader.GetOrdinal("Description"))
                ? null
                : reader.GetString(reader.GetOrdinal("Description"))
        );
    }

    public async Task<IReadOnlyList<QuizQuestionDto>> GetQuestionsAsync(int quizId, CancellationToken ct)
    {
        // Прямой SELECT по индексу IX_вопрос_викторины (id_викторины) — отдельной SP не требуется.
        const string sql = """
            SELECT
                [id_вопроса]                AS Id,
                [id_викторины]              AS QuizId,
                [текст_вопроса]             AS Text,
                [вариант_ответа_1]          AS Option1,
                [вариант_ответа_2]          AS Option2,
                [вариант_ответа_3]          AS Option3,
                [вариант_ответа_4]          AS Option4,
                [индекс_правильного_ответа] AS CorrectIndex
            FROM [вопрос_викторины]
            WHERE [id_викторины] = @quizId
            ORDER BY [id_вопроса];
            """;

        await using var conn = _connectionFactory.CreateConnection();
        await conn.OpenAsync(ct);

        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@quizId", quizId);

        await using var reader = await cmd.ExecuteReaderAsync(ct);

        var result = new List<QuizQuestionDto>();
        while (await reader.ReadAsync(ct))
        {
            result.Add(new QuizQuestionDto(
                Id: reader.GetInt32(reader.GetOrdinal("Id")),
                QuizId: reader.GetInt32(reader.GetOrdinal("QuizId")),
                Text: reader.GetString(reader.GetOrdinal("Text")),
                Option1: reader.GetString(reader.GetOrdinal("Option1")),
                Option2: reader.GetString(reader.GetOrdinal("Option2")),
                Option3: reader.GetString(reader.GetOrdinal("Option3")),
                Option4: reader.GetString(reader.GetOrdinal("Option4")),
                CorrectIndex: reader.GetInt32(reader.GetOrdinal("CorrectIndex"))
            ));
        }

        return result;
    }

    public async Task<QuizResultDto> SubmitResultAsync(int userId, int quizId, int correctAnswers, int totalQuestions, CancellationToken ct)
    {
        await using var conn = _connectionFactory.CreateConnection();
        await conn.OpenAsync(ct);

        await using var cmd = new SqlCommand("[dbo].[Викторина_СохранитьРезультат]", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.Add(new SqlParameter("@id_пользователя", SqlDbType.Int) { Value = userId });
        cmd.Parameters.Add(new SqlParameter("@id_викторины", SqlDbType.Int) { Value = quizId });
        cmd.Parameters.Add(new SqlParameter("@количество_правильных_ответов", SqlDbType.Int) { Value = correctAnswers });
        var idParam = new SqlParameter("@id_результата", SqlDbType.Int) { Direction = ParameterDirection.Output };
        cmd.Parameters.Add(idParam);

        await cmd.ExecuteNonQueryAsync(ct);

        var insertedId = (int)idParam.Value!;
        return new QuizResultDto(insertedId, userId, quizId, correctAnswers, totalQuestions);
    }

    public async Task<IReadOnlyList<QuizResultDto>> GetUserResultsAsync(int userId, CancellationToken ct)
    {
        await using var conn = _connectionFactory.CreateConnection();
        await conn.OpenAsync(ct);

        await using var cmd = new SqlCommand("[dbo].[Пользователь_РезультатыВикторин]", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.Add(new SqlParameter("@id_пользователя", SqlDbType.Int) { Value = userId });

        await using var reader = await cmd.ExecuteReaderAsync(ct);

        var result = new List<QuizResultDto>();
        while (await reader.ReadAsync(ct))
        {
            result.Add(new QuizResultDto(
                Id: reader.GetInt32(reader.GetOrdinal("Id")),
                UserId: reader.GetInt32(reader.GetOrdinal("UserId")),
                QuizId: reader.GetInt32(reader.GetOrdinal("QuizId")),
                CorrectAnswers: reader.GetInt32(reader.GetOrdinal("CorrectAnswers")),
                TotalQuestions: reader.GetInt32(reader.GetOrdinal("TotalQuestions"))
            ));
        }

        return result;
    }
}
