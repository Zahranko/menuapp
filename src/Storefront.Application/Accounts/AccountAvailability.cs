using Storefront.Application.Abstractions;
using Storefront.Domain.Common;

namespace Storefront.Application.Accounts;

/// <summary>For each field, null when it can be used for a new account, otherwise the message to show under it.</summary>
public sealed record AccountAvailabilityResponse(string? Email, string? Phone);

/// <summary>Tells the sign-up form, before it is sent, whether an email or phone number already has an account.</summary>
public sealed class AccountAvailabilityHandler(IIdentityService identity)
{
    public const string EmailTaken = "An account with this email already exists. Log in instead.";
    public const string PhoneTaken = "An account with this phone number already exists. Log in instead.";

    public async Task<AccountAvailabilityResponse> Handle(string? email, string? phone, CancellationToken ct)
    {
        string? emailProblem = null;
        string? phoneProblem = null;

        var trimmed = email?.Trim() ?? "";
        if (trimmed.Contains('@') && await identity.FindByLoginAsync(trimmed, ct) is not null)
        {
            emailProblem = EmailTaken;
        }

        if (Normalize(phone) is { } e164 && await identity.FindByLoginAsync(e164, ct) is not null)
        {
            phoneProblem = PhoneTaken;
        }

        return new AccountAvailabilityResponse(emailProblem, phoneProblem);
    }

    /// <summary>The field errors for a taken email or phone, or null when both are free.</summary>
    public async Task<Dictionary<string, string[]>?> ProblemsAsync(string? email, string? phone, CancellationToken ct)
    {
        var result = await Handle(email, phone, ct);
        var fields = new Dictionary<string, string[]>();
        if (result.Email is { } e)
        {
            fields["email"] = [e];
        }

        if (result.Phone is { } p)
        {
            fields["phone"] = [p];
        }

        return fields.Count > 0 ? fields : null;
    }

    private static string? Normalize(string? phone)
    {
        try
        {
            return string.IsNullOrWhiteSpace(phone) ? null : PhoneNumber.Create(phone).Value;
        }
        catch (DomainException)
        {
            return null;
        }
    }
}
