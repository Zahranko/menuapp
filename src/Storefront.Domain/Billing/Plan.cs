namespace Storefront.Domain.Billing;

public sealed class Plan
{
    public const string Basic = "basic";
    public const string Pro = "pro";

    private Plan()
    {
    }

    public string Code { get; private set; } = "";
    public string Name { get; private set; } = "";
    public decimal PriceUsd { get; private set; }
    public bool AllowsCustomDomain { get; private set; }

    public static Plan Create(string code, string name, decimal priceUsd, bool allowsCustomDomain) =>
        new() { Code = code, Name = name, PriceUsd = priceUsd, AllowsCustomDomain = allowsCustomDomain };

    public void Update(string name, decimal priceUsd, bool allowsCustomDomain)
    {
        Name = name;
        PriceUsd = priceUsd;
        AllowsCustomDomain = allowsCustomDomain;
    }
}
