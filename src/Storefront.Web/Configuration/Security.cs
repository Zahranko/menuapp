using System.Net;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;

namespace Storefront.Web.Configuration;

/// <summary>Settings under "Security". Production runs behind Caddy, which terminates TLS and forwards the client's address.</summary>
public sealed class SecurityOptions
{
    public const string SectionName = "Security";

    /// <summary>Refuse plain HTTP (GET and HEAD are redirected, anything else gets 400) and send HSTS. Off in Development.</summary>
    public bool RequireHttps { get; set; } = true;

    /// <summary>HSTS max-age in days.</summary>
    public int HstsDays { get; set; } = 365;

    /// <summary>Proxy addresses allowed to set X-Forwarded-For/-Proto, comma-separated (loopback is always trusted).</summary>
    public string KnownProxies { get; set; } = "";

    /// <summary>Proxy networks in CIDR form, comma-separated, for example the Docker network Caddy runs in.</summary>
    public string KnownNetworks { get; set; } = "";

    /// <summary>Largest request body in bytes. Uploads set their own, larger limit.</summary>
    public long MaxRequestBodyBytes { get; set; } = 1024 * 1024;
}

public static class Security
{
    public static WebApplicationBuilder AddStorefrontSecurity(this WebApplicationBuilder builder)
    {
        var section = builder.Configuration.GetSection(SecurityOptions.SectionName);
        builder.Services.Configure<SecurityOptions>(section);
        var options = section.Get<SecurityOptions>() ?? new SecurityOptions();

        builder.WebHost.ConfigureKestrel(k =>
        {
            k.AddServerHeader = false;
            k.Limits.MaxRequestBodySize = options.MaxRequestBodyBytes;
        });

        builder.Services.Configure<ForwardedHeadersOptions>(f =>
        {
            f.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            f.ForwardLimit = 1;
            foreach (var proxy in Split(options.KnownProxies))
            {
                f.KnownProxies.Add(IPAddress.Parse(proxy));
            }

            foreach (var network in Split(options.KnownNetworks))
            {
                f.KnownIPNetworks.Add(System.Net.IPNetwork.Parse(network));
            }
        });

        // No CORS policy is registered on purpose: the mobile app does not need one and the back office is same-origin,
        // so browsers on other origins cannot read API responses.
        return builder;
    }

    /// <summary>Runs first, so rate limits, HTTPS checks and logs see the real client address and scheme.</summary>
    public static WebApplication UseStorefrontSecurity(this WebApplication app)
    {
        var options = app.Services.GetRequiredService<Microsoft.Extensions.Options.IOptions<SecurityOptions>>().Value;
        app.UseForwardedHeaders();
        app.Use(async (context, next) =>
        {
            var request = context.Request;
            if (options.RequireHttps && !request.IsHttps && !IsHealthCheck(request))
            {
                await RefusePlainHttpAsync(context);
                return;
            }

            var headers = context.Response.Headers;
            headers.XContentTypeOptions = "nosniff";
            headers.XFrameOptions = "DENY";
            headers["Referrer-Policy"] = "no-referrer";
            if (options.RequireHttps)
            {
                headers.StrictTransportSecurity = $"max-age={options.HstsDays * 86400}; includeSubDomains";
            }

            if (request.Path.StartsWithSegments("/api"))
            {
                // JSON only: nothing here may run scripts, be framed or be embedded by another site.
                headers.ContentSecurityPolicy = "default-src 'none'; frame-ancestors 'none'";
                headers["Cross-Origin-Resource-Policy"] = "same-origin";
            }

            if (request.Path.StartsWithSegments("/api/v1"))
            {
                // Owner data and tokens must never be stored by a browser or proxy cache (endpoints that opt in keep their own header).
                context.Response.OnStarting(() =>
                {
                    if (!context.Response.Headers.ContainsKey("Cache-Control"))
                    {
                        context.Response.Headers.CacheControl = "no-store";
                    }

                    return Task.CompletedTask;
                });
            }

            await next();
        });
        return app;
    }

    private static bool IsHealthCheck(HttpRequest request) => request.Path.StartsWithSegments("/health");

    private static async Task RefusePlainHttpAsync(HttpContext context)
    {
        var request = context.Request;
        if (HttpMethods.IsGet(request.Method) || HttpMethods.IsHead(request.Method))
        {
            context.Response.StatusCode = StatusCodes.Status308PermanentRedirect;
            context.Response.Headers.Location = $"https://{request.Host}{request.PathBase}{request.Path}{request.QueryString}";
            return;
        }

        // Redirecting a POST would send the password or token over plain HTTP a second time; refuse instead.
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        await context.Response.WriteAsJsonAsync(
            new ProblemDetails { Status = StatusCodes.Status400BadRequest, Title = "Use HTTPS." },
            options: null,
            contentType: "application/problem+json");
    }

    private static IEnumerable<string> Split(string value) =>
        value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
}
