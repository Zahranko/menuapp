namespace Storefront.Domain.Common;

/// <summary>An amount in a currency, rounded to that currency's minor units (JOD has 3 decimals).</summary>
public readonly record struct Money
{
    private static readonly Dictionary<string, int> Decimals = new(StringComparer.OrdinalIgnoreCase)
    {
        ["JOD"] = 3, ["KWD"] = 3, ["BHD"] = 3, ["OMR"] = 3, ["IQD"] = 3, ["LYD"] = 3, ["TND"] = 3,
        ["JPY"] = 0, ["KRW"] = 0, ["VND"] = 0, ["CLP"] = 0, ["ISK"] = 0,
    };

    public Money(decimal amount, string currency)
    {
        if (string.IsNullOrWhiteSpace(currency) || currency.Trim().Length != 3)
        {
            throw new DomainException("money.currency", "Currency must be a 3-letter ISO code.", "currency");
        }

        Currency = currency.Trim().ToUpperInvariant();
        Amount = Math.Round(amount, DecimalsFor(Currency), MidpointRounding.AwayFromZero);
    }

    public decimal Amount { get; }

    public string Currency { get; }

    public static int DecimalsFor(string currency) => Decimals.GetValueOrDefault(currency, 2);

    public static decimal Round(decimal amount, string currency) =>
        Math.Round(amount, DecimalsFor(currency), MidpointRounding.AwayFromZero);

    public override string ToString() => $"{Amount.ToString($"F{DecimalsFor(Currency)}", System.Globalization.CultureInfo.InvariantCulture)} {Currency}";
}
