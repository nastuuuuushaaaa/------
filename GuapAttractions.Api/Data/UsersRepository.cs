using GuapAttractions.Api.Models;
using Microsoft.Data.SqlClient;
using System.Security.Cryptography;
using System.Text;

namespace GuapAttractions.Api.Data;

public class UsersRepository
{
    private readonly SqlConnectionFactory _connectionFactory;

    public UsersRepository(SqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<UserDto?> GetByEmailAsync(string email, CancellationToken ct)
    {
        const string sql = """
            SELECT TOP 1
                [id_пользователя] AS Id,
                [имя] AS FirstName,
                [фамилия] AS LastName,
                [email] AS Email
            FROM [пользователь]
            WHERE [email] = @email;
            """;

        await using var conn = _connectionFactory.CreateConnection();
        await conn.OpenAsync(ct);

        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@email", email);

        await using var reader = await cmd.ExecuteReaderAsync(ct);
        if (!await reader.ReadAsync(ct))
            return null;

        return new UserDto(
            Id: reader.GetInt32(reader.GetOrdinal("Id")),
            FirstName: reader.GetString(reader.GetOrdinal("FirstName")),
            LastName: reader.IsDBNull(reader.GetOrdinal("LastName"))
                ? null
                : reader.GetString(reader.GetOrdinal("LastName")),
            Email: reader.GetString(reader.GetOrdinal("Email"))
        );
    }

    private static string ComputePasswordHash(string password)
    {
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(bytes);
    }

    public async Task<UserDto?> GetByEmailAndPasswordAsync(string email, string password, CancellationToken ct)
    {
        const string sql = """
            SELECT TOP 1
                [id_пользователя] AS Id,
                [имя] AS FirstName,
                [фамилия] AS LastName,
                [email] AS Email,
                [хэш_пароля] AS PasswordHash
            FROM [пользователь]
            WHERE [email] = @email AND [хэш_пароля] = @passwordHash;
            """;

        var hash = ComputePasswordHash(password);

        await using var conn = _connectionFactory.CreateConnection();
        await conn.OpenAsync(ct);

        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@email", email);
        cmd.Parameters.AddWithValue("@passwordHash", hash);

        await using var reader = await cmd.ExecuteReaderAsync(ct);
        if (!await reader.ReadAsync(ct))
            return null;

        return new UserDto(
            Id: reader.GetInt32(reader.GetOrdinal("Id")),
            FirstName: reader.GetString(reader.GetOrdinal("FirstName")),
            LastName: reader.IsDBNull(reader.GetOrdinal("LastName"))
                ? null
                : reader.GetString(reader.GetOrdinal("LastName")),
            Email: reader.GetString(reader.GetOrdinal("Email"))
        );
    }

    public async Task<UserDto> CreateAsync(string firstName, string lastName, string email, string password, CancellationToken ct)
    {
        const string sql = """
            INSERT INTO [пользователь] ([имя], [фамилия], [email], [хэш_пароля], [подтверждение_почты])
            VALUES (@firstName, @lastName, @email, @passwordHash, 1);

            SELECT SCOPE_IDENTITY();
            """;

        await using var conn = _connectionFactory.CreateConnection();
        await conn.OpenAsync(ct);

        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@firstName", firstName);
        cmd.Parameters.AddWithValue("@lastName", lastName);
        cmd.Parameters.AddWithValue("@email", email);
        cmd.Parameters.AddWithValue("@passwordHash", ComputePasswordHash(password));

        var scalar = await cmd.ExecuteScalarAsync(ct);
        var id = Convert.ToInt32(scalar);

        return new UserDto(id, firstName, lastName, email);
    }

    public async Task<bool> UpdatePasswordAsync(string email, string newPassword, CancellationToken ct)
    {
        const string sql = """
            UPDATE [пользователь]
            SET [хэш_пароля] = @passwordHash
            WHERE [email] = @email;
            """;

        await using var conn = _connectionFactory.CreateConnection();
        await conn.OpenAsync(ct);

        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@email", email);
        cmd.Parameters.AddWithValue("@passwordHash", ComputePasswordHash(newPassword));

        var rows = await cmd.ExecuteNonQueryAsync(ct);
        return rows > 0;
    }
}

