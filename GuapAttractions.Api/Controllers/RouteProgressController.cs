using GuapAttractions.Api.Data;
using GuapAttractions.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace GuapAttractions.Api.Controllers;

[ApiController]
[Route("api/routes/{routeId:int}/progress")]
public class RouteProgressController : ControllerBase
{
    private readonly RouteProgressRepository _progress;

    public RouteProgressController(RouteProgressRepository progress)
    {
        _progress = progress;
    }

    private bool TryGetUserId(out int userId)
    {
        userId = 0;
        if (!Request.Headers.TryGetValue("X-User-Id", out var values))
            return false;
        return int.TryParse(values.FirstOrDefault(), out userId);
    }

    [HttpGet]
    public async Task<ActionResult<RouteProgressDto>> GetProgress([FromRoute] int routeId, CancellationToken ct)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized("Отсутствует заголовок X-User-Id.");

        var progress = await _progress.GetProgressAsync(userId, routeId, ct);
        if (progress is null)
            return NotFound();

        return Ok(progress);
    }

    public record SaveProgressRequest(int LastPointId, IReadOnlyList<int> ExcludedPointIds);

    [HttpPost]
    public async Task<IActionResult> SaveProgress([FromRoute] int routeId, [FromBody] SaveProgressRequest body, CancellationToken ct)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized("Отсутствует заголовок X-User-Id.");

        await _progress.SaveProgressAsync(userId, routeId, body.LastPointId, body.ExcludedPointIds, ct);
        return NoContent();
    }

    public record CompleteRequest(int LastPointId);

    [HttpPost("complete")]
    public async Task<IActionResult> Complete([FromRoute] int routeId, [FromBody] CompleteRequest body, CancellationToken ct)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized("Отсутствует заголовок X-User-Id.");

        await _progress.MarkCompletedAsync(userId, routeId, body.LastPointId, ct);
        return NoContent();
    }

    [HttpDelete]
    public async Task<IActionResult> ResetProgress([FromRoute] int routeId, CancellationToken ct)
    {
        if (!TryGetUserId(out var userId))
            return Unauthorized("Отсутствует заголовок X-User-Id.");

        await _progress.ResetProgressAsync(userId, routeId, ct);
        return NoContent();
    }
}

