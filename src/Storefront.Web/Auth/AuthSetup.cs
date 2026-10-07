using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Storefront.Infrastructure.Identity;

namespace Storefront.Web.Auth;

public static class AuthSetup
{
    public static IServiceCollection AddStorefrontAuth(this IServiceCollection services)
    {
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
        services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
            .Configure<IOptions<AuthOptions>>((jwt, auth) =>
            {
                var o = auth.Value;
                jwt.MapInboundClaims = false;
                jwt.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidIssuer = o.Issuer,
                    ValidAudience = o.Audience,
                    IssuerSigningKey = o.Key(),
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateIssuerSigningKey = true,
                    ValidateLifetime = true,
                    RequireExpirationTime = true,
                    RequireSignedTokens = true,
                    // Only the algorithm we sign with: no "none", no RS/HS confusion.
                    ValidAlgorithms = [SecurityAlgorithms.HmacSha256],
                    ClockSkew = TimeSpan.FromSeconds(30),
                    NameClaimType = "sub",
                    RoleClaimType = "role",
                };
            });
        services.AddAuthorization();
        return services;
    }

    /// <summary>Stops the app outside Development when the signing key is missing, short or the committed development key.</summary>
    public static void CheckSigningKey(this WebApplication app)
    {
        if (app.Environment.IsDevelopment())
        {
            return;
        }

        var key = app.Services.GetRequiredService<IOptions<AuthOptions>>().Value.SigningKey;
        if (key.StartsWith("development-only", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Auth:SigningKey is the development key. Set a secret Auth__SigningKey for this environment.");
        }

        _ = app.Services.GetRequiredService<IOptions<AuthOptions>>().Value.Key();
    }
}
