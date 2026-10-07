using FluentValidation;
using Storefront.Application.Abstractions;
using Storefront.Application.Common;
using Storefront.Domain.Common;

namespace Storefront.Application.Accounts;

/// <summary><see cref="LogIn.Login"/> is an email or a phone number with its country code.</summary>
public sealed record LogIn(string Login, string Password, string? DeviceName = null);

public sealed class LoginValidator : AbstractValidator<LogIn>
{
    public LoginValidator()
    {
        RuleFor(x => x.Login).NotEmpty().WithMessage("Enter your email or phone number.");
        RuleFor(x => x.Password).NotEmpty().WithMessage("Enter your password.");
    }
}

public sealed class LoginHandler(IValidator<LogIn> validator, IIdentityService identity, IBusinessRepository businesses, SessionIssuer sessions)
{
    public static readonly Error WrongCredentials = Error.Unauthorized("auth.invalid", "That email, phone or password doesn't match. Try again.");
    public static readonly Error LockedOut = Error.Unauthorized("auth.locked", "Too many tries. Wait 5 minutes and try again.");

    public async Task<Result<AuthResponse>> Handle(LogIn cmd, CancellationToken ct)
    {
        if (await validator.CheckAsync(cmd, ct) is { } invalid)
        {
            return invalid;
        }

        var login = cmd.Login.Trim();
        if (!login.Contains('@'))
        {
            try
            {
                login = PhoneNumber.Create(login).Value;
            }
            catch (DomainException)
            {
                return WrongCredentials;
            }
        }

        var user = await identity.FindByLoginAsync(login, ct);
        if (user is null)
        {
            return WrongCredentials;
        }

        switch (await identity.CheckPasswordAsync(user.Id, cmd.Password, ct))
        {
            case PasswordCheck.LockedOut:
                return LockedOut;
            case PasswordCheck.Wrong:
                return WrongCredentials;
        }

        var business = await businesses.GetByOwnerAsync(user.Id, ct);
        if (business is null)
        {
            return WrongCredentials;
        }

        return await sessions.IssueAsync(user, business, cmd.DeviceName, ct);
    }
}
