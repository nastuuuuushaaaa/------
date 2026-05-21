using GuapAttractions.Api.Data;
using GuapAttractions.Api.Models;
using GuapAttractions.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace GuapAttractions.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UsersRepository _users;
    private readonly EmailService _email;
    private readonly VerificationStore _verification;
    private readonly PasswordResetStore _passwordReset;
    private readonly ILogger<AuthController> _log;

    public AuthController(
        UsersRepository users,
        EmailService email,
        VerificationStore verification,
        PasswordResetStore passwordReset,
        ILogger<AuthController> log)
    {
        _users = users;
        _email = email;
        _verification = verification;
        _passwordReset = passwordReset;
        _log = log;
    }

    /// <summary>Проверка, что API свежий: откройте /api/auth/ping в браузере или в Swagger; 404 значит, что крутится старая сборка — остановите процесс и перезапустите API.</summary>
    [HttpGet("ping")]
    public IActionResult Ping() =>
        Ok(new { ok = true, service = "GuapAttractions.Api", auth = "register, verify, login, forgot-password, reset-password" });

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        var existing = await _users.GetByEmailAsync(request.Email, ct);
        if (existing is not null)
            return Conflict("Пользователь с таким email уже существует.");

        var code = _verification.CreatePending(
            request.FirstName, request.LastName, request.Email, request.Password);

        _log.LogWarning("Код подтверждения для {Email}: {Code}", request.Email, code);

        bool emailSent = false;
        try
        {
            await _email.SendVerificationCodeAsync(request.Email, code, ct);
            emailSent = true;
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "Не удалось отправить письмо на {Email}. Код: {Code}", request.Email, code);
        }

        var msg = emailSent
            ? $"Код подтверждения отправлен на {request.Email}"
            : $"Не удалось отправить письмо, но код создан. Проверьте консоль сервера.";

        return Ok(new { message = msg });
    }

    public record VerifyRequest(string Email, string Code);

    [HttpPost("verify")]
    public async Task<ActionResult<UserDto>> Verify([FromBody] VerifyRequest request, CancellationToken ct)
    {
        var pending = _verification.Verify(request.Email, request.Code);
        if (pending is null)
            return BadRequest("Неверный или просроченный код подтверждения.");

        var existing = await _users.GetByEmailAsync(pending.Email, ct);
        if (existing is not null)
            return Conflict("Пользователь с таким email уже существует.");

        var user = await _users.CreateAsync(
            pending.FirstName, pending.LastName, pending.Email, pending.Password, ct);

        return Ok(user);
    }

    [HttpPost("login")]
    public async Task<ActionResult<UserDto>> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var user = await _users.GetByEmailAndPasswordAsync(request.Email, request.Password, ct);
        if (user is null)
            return Unauthorized("Неверный email или пароль.");

        return Ok(user);
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest? request, CancellationToken ct)
    {
        if (request is null)
            return BadRequest("Отправьте JSON: { \"email\": \"user@example.com\" }.");

        var email = request.Email?.Trim() ?? "";
        if (string.IsNullOrWhiteSpace(email))
            return BadRequest("Укажите email.");

        var user = await _users.GetByEmailAsync(email, ct);
        if (user is not null)
        {
            var code = _passwordReset.Create(email);
            try
            {
                await _email.SendPasswordResetCodeAsync(email, code, ct);
            }
            catch (Exception ex)
            {
                _log.LogError(ex, "Не удалось отправить письмо восстановления на {Email}", email);
                _passwordReset.Remove(email);
            }
        }

        return Ok(new
        {
            message = "Если указанный адрес зарегистрирован, на него отправлено письмо с кодом восстановления."
        });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest? request, CancellationToken ct)
    {
        if (request is null)
            return BadRequest("Отправьте JSON с полями email, code, newPassword.");

        var email = request.Email?.Trim() ?? "";
        if (string.IsNullOrWhiteSpace(email)
            || string.IsNullOrWhiteSpace(request.Code)
            || string.IsNullOrWhiteSpace(request.NewPassword))
            return BadRequest("Заполните все поля.");

        if (request.NewPassword.Length < 4)
            return BadRequest("Пароль должен быть не короче 4 символов.");

        if (!_passwordReset.TryConsume(email, request.Code))
            return BadRequest("Неверный или просроченный код.");

        var updated = await _users.UpdatePasswordAsync(email, request.NewPassword, ct);
        if (!updated)
            return BadRequest("Не удалось обновить пароль.");

        return Ok(new { message = "Пароль успешно изменён. Теперь можно войти." });
    }
}
