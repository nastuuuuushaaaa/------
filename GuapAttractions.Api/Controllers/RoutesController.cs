using GuapAttractions.Api.Data;
using Microsoft.AspNetCore.Mvc;

namespace GuapAttractions.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoutesController : ControllerBase
{
    private readonly RoutesRepository _routesRepository;

    public RoutesController(RoutesRepository routesRepository)
    {
        _routesRepository = routesRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetRoutesAsync(CancellationToken cancellationToken)
    {
        var routes = await _routesRepository.GetRoutesAsync(cancellationToken);
        return Ok(routes);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetRouteByIdAsync([FromRoute] int id, CancellationToken cancellationToken)
    {
        var route = await _routesRepository.GetRouteByIdAsync(id, cancellationToken);
        return route is null ? NotFound() : Ok(route);
    }
}

