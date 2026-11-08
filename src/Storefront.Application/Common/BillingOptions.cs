namespace Storefront.Application.Common;

/// <summary>App settings under the "Billing" section.</summary>
public sealed class BillingOptions
{
    public const string SectionName = "Billing";

    /// <summary>
    /// Test servers only: every business is on an active Pro plan (new sign-ups too, and existing ones at startup),
    /// so owners can try every feature without paying.
    /// </summary>
    public bool TestMode { get; set; }
}
