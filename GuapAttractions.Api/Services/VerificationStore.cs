using System.Collections.Concurrent;

namespace GuapAttractions.Api.Services;

public record PendingRegistration(
    string FirstName,
    string LastName,
    string Email,
    string Password,
    string Code,
    DateTime ExpiresAt
);

public class VerificationStore
{
    private readonly ConcurrentDictionary<string, PendingRegistration> _pending = new(StringComparer.OrdinalIgnoreCase);

    public string CreatePending(string firstName, string lastName, string email, string password)
    {
        var code = Random.Shared.Next(100000, 999999).ToString();
        var entry = new PendingRegistration(firstName, lastName, email, password, code, DateTime.UtcNow.AddMinutes(10));
        _pending[email] = entry;
        return code;
    }

    public PendingRegistration? Verify(string email, string code)
    {
        if (!_pending.TryGetValue(email, out var entry))
            return null;

        if (DateTime.UtcNow > entry.ExpiresAt)
        {
            _pending.TryRemove(email, out _);
            return null;
        }

        if (entry.Code != code)
            return null;

        _pending.TryRemove(email, out _);
        return entry;
    }

    public bool HasPending(string email)
    {
        if (!_pending.TryGetValue(email, out var entry))
            return false;

        if (DateTime.UtcNow > entry.ExpiresAt)
        {
            _pending.TryRemove(email, out _);
            return false;
        }

        return true;
    }

    public void RemovePending(string email)
    {
        _pending.TryRemove(email, out _);
    }
}
