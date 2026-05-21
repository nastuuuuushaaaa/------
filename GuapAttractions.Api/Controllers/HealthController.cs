using GuapAttractions.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace GuapAttractions.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly SqlConnectionFactory _connectionFactory;

    public HealthController(SqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    [HttpGet("db")]
    public async Task<IActionResult> CheckDatabaseAsync(CancellationToken cancellationToken)
    {
        await using SqlConnection connection = _connectionFactory.CreateConnection();

        try
        {
            await connection.OpenAsync(cancellationToken);
            await using var command = connection.CreateCommand();
            command.CommandText = "SELECT 1";
            var result = await command.ExecuteScalarAsync(cancellationToken);

            return Ok(new
            {
                status = "ok",
                db = "connected",
                result
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                status = "error",
                db = "unavailable",
                message = ex.Message
            });
        }
    }
}

