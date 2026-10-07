using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace Storefront.Web.Auth;

public static class RateLimits
{
    public const string Auth = "auth";
    public const string SlugCheck = "slug-check";
    public const string Public = "public";

    /// <summary>Per client IP. Limits come from "RateLimits:*PerMinute" so tests and load checks can raise them.</summary>
    public static IServiceCollection AddStorefrontRateLimits(this IServiceCollection services, IConfiguration configuration)
    {
        var section = configuration.GetSection("RateLimits");
        services.AddRateLimiter(o =>
        {
            o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            Add(o, Auth, section.GetValue("AuthPerMinute", 10));
            Add(o, SlugCheck, section.GetValue("SlugCheckPerMinute", 60));
            Add(o, Public, section.GetValue("PublicPerMinute", 600));
        });
        return services;
    }

    private static void Add(RateLimiterOptions options, string name, int perMinute) =>
        options.AddPolicy(name, context => RateLimitPartition.GetFixedWindowLimiter(
            $"{name}:{context.Connection.RemoteIpAddress}",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = perMinute, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
}
