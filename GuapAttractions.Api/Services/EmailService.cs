using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace GuapAttractions.Api.Services;

public class SmtpOptions
{
    public const string SectionName = "Smtp";
    public string Host { get; set; } = "";
    public int Port { get; set; } = 587;
    public bool UseSsl { get; set; } = true;
    public string SenderEmail { get; set; } = "";
    public string SenderName { get; set; } = "";
    public string Password { get; set; } = "";
}

public class EmailService
{
    private readonly SmtpOptions _options;
    private readonly ILogger<EmailService> _log;

    public EmailService(SmtpOptions options, ILogger<EmailService> log)
    {
        _options = options;
        _log = log;
    }

    public async Task SendVerificationCodeAsync(string toEmail, string code, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_options.SenderEmail) || string.IsNullOrWhiteSpace(_options.Password))
            throw new InvalidOperationException("SMTP не настроен: укажите Smtp:SenderEmail и Smtp:Password в appsettings.json.");

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_options.SenderName, _options.SenderEmail));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = "Код подтверждения регистрации — GUAP Маршруты";

        var html = $"""
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
                <h2 style="color: #0ea5e9;">GUAP Маршруты</h2>
                <p>Ваш код подтверждения:</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center;
                            padding: 16px; background: #f1f5f9; border-radius: 12px; margin: 16px 0;">
                    {code}
                </div>
                <p style="color: #64748b; font-size: 14px;">
                    Код действителен в течение 10 минут. Если вы не регистрировались, просто проигнорируйте это письмо.
                </p>
            </div>
            """;

        var body = new TextPart("html") { Text = html };
        body.ContentType.Charset = "utf-8";
        message.Body = body;

        Exception? lastError = null;
        var attempts = new (int Port, SecureSocketOptions Secure)[]
        {
            (_options.Port, GetSecureOptionForPort(_options.Port)),
            (587, SecureSocketOptions.StartTls),
            (465, SecureSocketOptions.SslOnConnect),
        };

        var seen = new HashSet<(int, SecureSocketOptions)>();
        foreach (var (port, secure) in attempts)
        {
            if (!seen.Add((port, secure)))
                continue;

            try
            {
                using var client = new SmtpClient { Timeout = 30000 };

                _log.LogInformation("SMTP: подключение к {Host}:{Port} ({Secure})...", _options.Host, port, secure);
                await client.ConnectAsync(_options.Host, port, secure, ct);

                _log.LogInformation("SMTP: аутентификация как {Login}...", _options.SenderEmail);
                await client.AuthenticateAsync(_options.SenderEmail, _options.Password, ct);

                await client.SendAsync(message, ct);
                await client.DisconnectAsync(true, ct);

                _log.LogInformation("Письмо с кодом отправлено на {To}", toEmail);
                return;
            }
            catch (Exception ex)
            {
                lastError = ex;
                _log.LogWarning(ex, "SMTP: не удалось отправить через порт {Port}", port);
            }
        }

        throw lastError ?? new InvalidOperationException("Не удалось подключиться к SMTP.");
    }

    public async Task SendPasswordResetCodeAsync(string toEmail, string code, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_options.SenderEmail) || string.IsNullOrWhiteSpace(_options.Password))
            throw new InvalidOperationException("SMTP не настроен: укажите Smtp:SenderEmail и Smtp:Password в appsettings.json.");

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_options.SenderName, _options.SenderEmail));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = "Восстановление пароля — GUAP Маршруты";

        var html = $"""
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
                <h2 style="color: #0ea5e9;">GUAP Маршруты</h2>
                <p>Код для восстановления пароля:</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center;
                            padding: 16px; background: #f1f5f9; border-radius: 12px; margin: 16px 0;">
                    {code}
                </div>
                <p style="color: #64748b; font-size: 14px;">
                    Код действителен 15 минут. Если вы не запрашивали сброс пароля, проигнорируйте это письмо.
                </p>
            </div>
            """;

        var body = new TextPart("html") { Text = html };
        body.ContentType.Charset = "utf-8";
        message.Body = body;

        Exception? lastError = null;
        var attempts = new (int Port, SecureSocketOptions Secure)[]
        {
            (_options.Port, GetSecureOptionForPort(_options.Port)),
            (587, SecureSocketOptions.StartTls),
            (465, SecureSocketOptions.SslOnConnect),
        };

        var seen = new HashSet<(int, SecureSocketOptions)>();
        foreach (var (port, secure) in attempts)
        {
            if (!seen.Add((port, secure)))
                continue;

            try
            {
                using var client = new SmtpClient { Timeout = 30000 };

                _log.LogInformation("SMTP (сброс пароля): подключение к {Host}:{Port} ({Secure})...", _options.Host, port, secure);
                await client.ConnectAsync(_options.Host, port, secure, ct);

                _log.LogInformation("SMTP: аутентификация как {Login}...", _options.SenderEmail);
                await client.AuthenticateAsync(_options.SenderEmail, _options.Password, ct);

                await client.SendAsync(message, ct);
                await client.DisconnectAsync(true, ct);

                _log.LogInformation("Письмо восстановления пароля отправлено на {To}", toEmail);
                return;
            }
            catch (Exception ex)
            {
                lastError = ex;
                _log.LogWarning(ex, "SMTP: не удалось отправить письмо сброса через порт {Port}", port);
            }
        }

        throw lastError ?? new InvalidOperationException("Не удалось подключиться к SMTP.");
    }

    private static SecureSocketOptions GetSecureOptionForPort(int port) => port switch
    {
        465 => SecureSocketOptions.SslOnConnect,
        587 => SecureSocketOptions.StartTls,
        25 => SecureSocketOptions.StartTls,
        _ => SecureSocketOptions.Auto,
    };
}
