namespace Storefront.Domain.Common;

/// <summary>The currencies an owner can price in (ISO 4217 codes). Prices are stored in the business currency without conversion.</summary>
public static class Currencies
{
    public const string Default = "USD";
    public const string UnsupportedMessage = "Choose a currency from the list.";

    /// <summary>In the order the apps list them.</summary>
    public static readonly IReadOnlyList<string> All =
    [
        "USD", "EUR", "GBP", "JOD", "SAR", "AED", "QAR", "KWD", "BHD", "OMR", "EGP", "LBP", "IQD", "SYP", "MAD", "TND",
        "DZD", "LYD", "YER", "SDG", "ILS", "TRY", "CAD", "AUD", "CHF", "SEK", "NOK", "DKK", "JPY", "CNY", "INR", "PKR",
        "MYR", "IDR", "NGN", "ZAR", "KES", "BRL", "MXN",
    ];

    private static readonly HashSet<string> Supported = new(All, StringComparer.OrdinalIgnoreCase);

    public static bool IsSupported(string? code) => code is not null && Supported.Contains(code.Trim());

    /// <summary>Digits after the decimal point: 3 for JOD, KWD, BHD, OMR, IQD, LYD and TND, 0 for JPY, 2 for the rest.</summary>
    public static int DecimalsFor(string code) => Money.DecimalsFor(code);

    /// <summary>The upper-case code, or a <c>business.currency</c> error when it is not in <see cref="All"/>.</summary>
    public static string Normalize(string? code, string field = "currencyCode")
    {
        if (!IsSupported(code))
        {
            throw new DomainException("business.currency", UnsupportedMessage, field);
        }

        return code!.Trim().ToUpperInvariant();
    }
}
