using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Storefront.Application.Abstractions;
using Storefront.Application.Common;

namespace Storefront.Infrastructure.Email;

/// <summary>Settings under "Email:Smtp". When Host is empty, emails are written to the log instead.</summary>
public sealed class SmtpOptions
{
    public const string SectionName = "Email:Smtp";

    public string? Host { get; set; }
    public int Port { get; set; } = 587;
    public string? UserName { get; set; }
    public string? Password { get; set; }
    public bool EnableSsl { get; set; } = true;
}

internal sealed class LogEmailSender(ILogger<LogEmailSender> logger) : IEmailSender
{
    public Task SendAsync(EmailMessage message, CancellationToken ct)
    {
        logger.LogInformation("Email to {To}: {Subject}\n{Text}", message.To, message.Subject, message.Text);
        return Task.CompletedTask;
    }
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
