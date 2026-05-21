namespace GuapAttractions.Api.Models;

public record UserDto(int Id, string FirstName, string? LastName, string Email);

public record RegisterRequest(string FirstName, string LastName, string Email, string Password);

public record LoginRequest(string Email, string Password);

public record ForgotPasswordRequest(string Email);

public record ResetPasswordRequest(string Email, string Code, string NewPassword);

public record RouteProgressDto(int RouteId, int? LastPointId, IReadOnlyList<int> ExcludedPointIds, bool Completed);

