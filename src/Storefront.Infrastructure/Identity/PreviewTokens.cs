using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Storefront.Application.Abstractions;

namespace Storefront.Infrastructure.Identity;

/// <summary>Token = base64url("businessId.expiresUnix") + "." + base64url(HMAC-SHA256), keyed from Auth:SigningKey.</summary>
internal sealed class PreviewTokens(IOptions<AuthOptions> options) : IPreviewTokens
{
    public string Create(Guid businessId, DateTimeOffset expiresAt)
    {
        var payload = Base64UrlEncoder.Encode($"{businessId:N}.{expiresAt.ToUnixTimeSeconds()}");
        return $"{payload}.{Sign(payload)}";
    }

    public Guid? Read(string token, DateTimeOffset now)
    {
        var parts = (token ?? "").Split('.');
        if (parts.Length != 2 || !CryptographicOperations.FixedTimeEquals(Encoding.ASCII.GetBytes(Sign(parts[0])), Encoding.ASCII.GetBytes(parts[1])))
        {
            return null;
        }

        string decoded;
        try
        {
            decoded = Base64UrlEncoder.Decode(parts[0]);
        }
        catch (FormatException)
        {
            return null;
        }

        var fields = decoded.Split('.');
        if (fields.Length != 2 || !Guid.TryParseExact(fields[0], "N", out var businessId) || !long.TryParse(fields[1], out var expires))
        {
            return null;
        }

        return now.ToUnixTimeSeconds() < expires ? businessId : null;
    }

    private string Sign(string payload)
    {
        var key = SHA256.HashData(Encoding.UTF8.GetBytes("preview:" + options.Value.SigningKey));
        return Base64UrlEncoder.Encode(HMACSHA256.HashData(key, Encoding.ASCII.GetBytes(payload)));
    }
}
