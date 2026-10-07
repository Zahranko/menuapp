using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Storefront.Application.Abstractions;
using Storefront.Application.Common;

namespace Storefront.Infrastructure.Identity;

internal sealed class IdentityService(UserManager<AppUser> users, IClock clock) : IIdentityService
{
    public async Task<Result<UserAccount>> CreateUserAsync(string email, string phone, string password, CancellationToken ct)
    {
        var fields = new Dictionary<string, string[]>();
        if (await users.FindByEmailAsync(email) is not null)
        {
            fields["email"] = ["An account with this email already exists. Log in instead."];
        }

        if (await users.Users.AnyAsync(u => u.PhoneNumber == phone, ct))
        {
            fields["phone"] = ["An account with this phone number already exists. Log in instead."];
        }

        if (fields.Count > 0)
        {
            return new Error("account.exists", "An account already exists.", ErrorType.Conflict, fields);
        }

        var user = new AppUser { UserName = email, Email = email, PhoneNumber = phone, CreatedAt = clock.UtcNow };
        var result = await users.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            var messages = result.Errors.Select(e => e.Description).ToArray();
            var field = result.Errors.Any(e => e.Code.StartsWith("Password", StringComparison.Ordinal)) ? "password" : "email";
            return Error.Validation(new Dictionary<string, string[]> { [field] = messages });
        }

        return new UserAccount(user.Id, user.Email!, user.PhoneNumber);
    }

    public async Task<UserAccount?> FindByLoginAsync(string login, CancellationToken ct)
    {
        var user = login.Contains('@')
            ? await users.FindByEmailAsync(login)
            : await users.Users.FirstOrDefaultAsync(u => u.PhoneNumber == login, ct);
        return user is null ? null : new UserAccount(user.Id, user.Email!, user.PhoneNumber);
    }

    public async Task<UserAccount?> FindByIdAsync(Guid userId, CancellationToken ct)
    {
        var user = await users.FindByIdAsync(userId.ToString());
        return user is null ? null : new UserAccount(user.Id, user.Email!, user.PhoneNumber);
    }

    public async Task<PasswordCheck> CheckPasswordAsync(Guid userId, string password, CancellationToken ct)
    {
        var user = await users.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            return PasswordCheck.Wrong;
        }

        if (await users.IsLockedOutAsync(user))
        {
            return PasswordCheck.LockedOut;
        }

        if (await users.CheckPasswordAsync(user, password))
        {
            await users.ResetAccessFailedCountAsync(user);
            return PasswordCheck.Ok;
        }

        await users.AccessFailedAsync(user);
        return await users.IsLockedOutAsync(user) ? PasswordCheck.LockedOut : PasswordCheck.Wrong;
    }

    public async Task<string> CreatePasswordResetTokenAsync(Guid userId, CancellationToken ct)
    {
        var user = await users.FindByIdAsync(userId.ToString()) ?? throw new InvalidOperationException("User not found.");
        return await users.GeneratePasswordResetTokenAsync(user);
    }

    public async Task<Result> ResetPasswordAsync(string email, string token, string newPassword, CancellationToken ct)
    {
        var invalidLink = Error.Validation("auth.resetToken", "This reset link is not valid or has expired. Ask for a new one.", "token");
        var user = await users.FindByEmailAsync(email);
        if (user is null)
        {
            return invalidLink;
        }

        var result = await users.ResetPasswordAsync(user, token, newPassword);
        if (result.Succeeded)
        {
            await users.SetLockoutEndDateAsync(user, null);
            await users.ResetAccessFailedCountAsync(user);
            return Result.Success();
        }

        if (result.Errors.Any(e => e.Code == "InvalidToken"))
        {
            return invalidLink;
        }

        return Error.Validation(new Dictionary<string, string[]> { ["newPassword"] = result.Errors.Select(e => e.Description).ToArray() });
    }
}

/// <summary>Identity's password messages in the prototype's words.</summary>
internal sealed class FriendlyIdentityErrors : IdentityErrorDescriber
{
    public override IdentityError PasswordTooShort(int length) => new() { Code = nameof(PasswordTooShort), Description = $"Password needs at least {length} characters." };

    public override IdentityError PasswordRequiresDigit() => new() { Code = nameof(PasswordRequiresDigit), Description = "Add a number to your password." };

    public override IdentityError PasswordRequiresUpper() => new() { Code = nameof(PasswordRequiresUpper), Description = "Add a capital letter to your password." };

    public override IdentityError DuplicateEmail(string email) => new() { Code = nameof(DuplicateEmail), Description = "An account with this email already exists. Log in instead." };

    public override IdentityError DuplicateUserName(string userName) => new() { Code = nameof(DuplicateUserName), Description = "An account with this email already exists. Log in instead." };
}
