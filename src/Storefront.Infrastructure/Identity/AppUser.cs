using Microsoft.AspNetCore.Identity;

namespace Storefront.Infrastructure.Identity;

public sealed class AppUser : IdentityUser<Guid>
{
    public AppUser()
    {
        Id = Guid.CreateVersion7();
        SecurityStamp = Guid.NewGuid().ToString();
    }

    public DateTimeOffset CreatedAt { get; set; }
}

public static class Roles
{
    public const string Staff = "Staff";
}
