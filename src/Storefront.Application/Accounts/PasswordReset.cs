using FluentValidation;
using Microsoft.Extensions.Options;
using Storefront.Application.Abstractions;
using Storefront.Application.Common;

namespace Storefront.Application.Accounts;

public sealed record ForgotPassword(string Email);

/// <summary>Always succeeds so nobody can find out which emails have accounts.</summary>
public sealed class ForgotPasswordHandler(IIdentityService identity, IEmailSender email, IOptions<BrandOptions> brand)
{
    public async Task Handle(ForgotPassword cmd, CancellationToken ct)
    {
        var address = (cmd.Email ?? "").Trim();
        if (!address.Contains('@') || await identity.FindByLoginAsync(address, ct) is not { } user)
        {
            return;
        }

        var token = await identity.CreatePasswordResetTokenAsync(user.Id, ct);
        var b = brand.Value;
        var link = $"https://{b.Domain}/reset-password?email={Uri.EscapeDataString(user.Email)}&token={Uri.EscapeDataString(token)}";
        var text = $"""
            Someone asked to reset the password for your {b.BrandName} account.

            Choose a new password here (the link works for 24 hours):
            {link}

            If it wasn't you, ignore this email. Your password stays the same.
            """;
        var html = $"""
            <p>Someone asked to reset the password for your {b.BrandName} account.</p>
            <p><a href="{System.Net.WebUtility.HtmlEncode(link)}">Choose a new password</a> (the link works for 24 hours).</p>
            <p>If it wasn't you, ignore this email. Your password stays the same.</p>
            """;
        await email.SendAsync(new EmailMessage(user.Email, $"Reset your {b.BrandName} password", text, html), ct);
    }
}

public sealed record ResetPassword(string Email, string Token, string NewPassword);

public sealed class ResetPasswordValidator : AbstractValidator<ResetPassword>
{
    public ResetPasswordValidator()
    {
        RuleFor(x => x.Email).Cascade(CascadeMode.Stop).ValidEmail();
        RuleFor(x => x.Token).NotEmpty().WithMessage("This reset link is not valid. Ask for a new one.");
        RuleFor(x => x.NewPassword).Cascade(CascadeMode.Stop).StrongPassword();
    }
}

public sealed class ResetPasswordHandler(IValidator<ResetPassword> validator, IIdentityService identity)
{
    public async Task<Result> Handle(ResetPassword cmd, CancellationToken ct)
    {
        if (await validator.CheckAsync(cmd, ct) is { } invalid)
        {
            return invalid;
        }

        return await identity.ResetPasswordAsync(cmd.Email.Trim(), cmd.Token, cmd.NewPassword, ct);
    }
}
