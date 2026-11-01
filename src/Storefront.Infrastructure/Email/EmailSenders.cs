using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Storefront.Application.Abstractions;
using Storefront.Application.Common;

namespace Storefront.Infrastructure.Email;

/// <summary>Settings under "Email:Smtp". When Host is empty, emails are not sent: only who they were for is logged.</summary>
public sealed class SmtpOptions
{
    public const string SectionName = "Email:Smtp";

    public string? Host { get; set; }
    public int Port { get; set; } = 587;
    public string? UserName { get; set; }
    public string? Password { get; set; }
    public bool EnableSsl { get; set; } = true;
}

/// <summary>
/// Stand-in while no SMTP server is set. Logs only the recipient and subject: bodies carry password reset links,
/// which must never reach the logs. Tests read emails through their own capturing sender.
/// </summary>
internal sealed class LogEmailSender(ILogger<LogEmailSender> logger) : IEmailSender
{
    public Task SendAsync(EmailMessage message, CancellationToken ct)
    {
        logger.LogInformation("Email not sent (no SMTP server set) to {To}: {Subject}", message.To, message.Subject);
        return Task.CompletedTask;
    }
}

/// <summary>Warns once at startup, outside Development, that emails (password resets, domain notices) are not being sent.</summary>
internal sealed class EmailConfigurationCheck(IConfiguration configuration, IHostEnvironment environment, ILogger<EmailConfigurationCheck> logger) : IHostedService
{
    public Task StartAsync(CancellationToken ct)
    {
        if (!environment.IsDevelopment() && string.IsNullOrWhiteSpace(configuration[$"{SmtpOptions.SectionName}:Host"]))
        {
            logger.LogWarning("Email is not configured (Email:Smtp:Host is empty). Password reset and other emails are not being sent.");
        }

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}

internal sealed class SmtpEmailSender(IOptions<SmtpOptions> smtp, IOptions<BrandOptions> brand) : IEmailSender
{
    public async Task SendAsync(EmailMessage message, CancellationToken ct)
    {
        var o = smtp.Value;
        using var client = new SmtpClient(o.Host, o.Port) { EnableSsl = o.EnableSsl };
        if (!string.IsNullOrEmpty(o.UserName))
        {
            client.Credentials = new NetworkCredential(o.UserName, o.Password);
        }

        using var mail = new MailMessage
        {
            From = new MailAddress(brand.Value.NoReplyEmail, brand.Value.BrandName),
            Subject = message.Subject,
            Body = message.Html,
            IsBodyHtml = true,
        };
        mail.To.Add(message.To);
        mail.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(message.Text, null, "text/plain"));
        await client.SendMailAsync(mail, ct);
    }
}
