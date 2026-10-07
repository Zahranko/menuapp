using System.Globalization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Storefront.Web.Auth;

public static class RateLimits
{
    public const string Auth = "auth";
    public const string SlugCheck = "slug-check";
    public const string Public = "public";

    /// <summary>
    /// Named policies are per client IP. On top, every request counts against a global per-IP limit and,
    /// when signed in, a per-owner limit, so one leaked token or one busy client cannot flood the API.
    /// Limits come from "RateLimits:*PerMinute" so tests and load checks can raise them.
    /// </summary>
    public static IServiceCollection AddStorefrontRateLimits(this IServiceCollection services, IConfiguration configuration)
    {
        var section = configuration.GetSection("RateLimits");
        services.AddRateLimiter(o =>
        {
            o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            o.OnRejected = OnRejectedAsync;
            Add(o, Auth, section.GetValue("AuthPerMinute", 10));
            Add(o, SlugCheck, section.GetValue("SlugCheckPerMinute", 60));
            Add(o, Public, section.GetValue("PublicPerMinute", 600));

            var perIp = section.GetValue("GlobalPerMinute", 1200);
            var perOwner = section.GetValue("OwnerPerMinute", 300);
            o.GlobalLimiter = PartitionedRateLimiter.CreateChained(
                PartitionedRateLimiter.Create<HttpContext, string>(context => IsExempt(context)
                    ? RateLimitPartition.GetNoLimiter("exempt")
                    : PerMinute($"ip:{ClientIp(context)}", perIp)),
                PartitionedRateLimiter.Create<HttpContext, string>(context => context.User.FindFirst("sub")?.Value is { } owner
                    ? PerMinute($"owner:{owner}", perOwner)
                    : RateLimitPartition.GetNoLimiter("anonymous")));
        });
        return services;
    }

    /// <summary>The client's address. Behind Caddy this is the real client, because forwarded headers are applied first.</summary>
    public static string ClientIp(HttpContext context) => context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

    private static bool IsExempt(HttpContext context) => context.Request.Path.StartsWithSegments("/health");

    private static RateLimitPartition<string> PerMinute(string key, int permits) =>
        RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions { PermitLimit = permits, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 });

    private static void Add(RateLimiterOptions options, string name, int perMinute) =>
        options.AddPolicy(name, context => PerMinute($"{name}:{ClientIp(context)}", perMinute));

    /// <summary>A 429 with Retry-After and a ProblemDetails body the apps can show.</summary>
    private static async ValueTask OnRejectedAsync(OnRejectedContext rejected, CancellationToken ct)
    {
        var response = rejected.HttpContext.Response;
        var seconds = rejected.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter) ? (int)Math.Ceiling(retryAfter.TotalSeconds) : 60;
        response.Headers.RetryAfter = Math.Max(1, seconds).ToString(CultureInfo.InvariantCulture);
        await response.WriteAsJsonAsync(
            new ProblemDetails
            {
                Status = StatusCodes.Status429TooManyRequests,
                Title = "Too many requests. Wait a minute and try again.",
                Type = "https://tools.ietf.org/html/rfc6585#section-4",
            },
            options: null,
            contentType: "application/problem+json",
            cancellationToken: ct);
    }
}
