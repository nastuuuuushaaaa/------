using System.Collections.Concurrent;

namespace GuapAttractions.Api.Services;

public record PendingPasswordReset(string Email, string Code, DateTime ExpiresAt);

public class PasswordResetStore
{
    private readonly ConcurrentDictionary<string, PendingPasswordReset> _pending = new(StringComparer.OrdinalIgnoreCase);

    /// <summary>Генерирует код сброса пароля по почте и отдаёт его для письма.</summary>
    public string Create(string email)
    {
        var code = Random.Shared.Next(100000, 999999).ToString();
        var entry = new PendingPasswordReset(email, code, DateTime.UtcNow.AddMinutes(15));
        _pending[email] = entry;
        return code;
    }

    public void Remove(string email) => _pending.TryRemove(email, out _);

    /// <summary>Если код совпал — снимает его с учёта.</summary>
    public bool TryConsume(string email, string code)
    {
        if (!_pending.TryGetValue(email, out var entry))
            return false;

        if (DateTime.UtcNow > entry.ExpiresAt)
        {
            _pending.TryRemove(email, out _);
            return false;
        }

        if (entry.Code != code)
            return false;

        _pending.TryRemove(email, out _);
        return true;
    }
}
