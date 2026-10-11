using Storefront.Domain.Common;

namespace Storefront.Domain.Businesses;

public sealed class Business : AggregateRoot
{
    public const int NameMax = 60;
    public const string DefaultTimeZone = "UTC";
    public const string TimeZoneMessage = "Choose a time zone from the list.";
    public static readonly IReadOnlySet<string> Locales = new HashSet<string> { "en", "ar" };

    private Business()
    {
    }

    public Guid OwnerUserId { get; private set; }
    public string Name { get; private set; } = "";
    public Slug Slug { get; private set; } = null!;
    public PhoneNumber? WhatsApp { get; private set; }
    public string? Email { get; private set; }
    public string? Address { get; private set; }
    public string? Instagram { get; private set; }
    public string CurrencyCode { get; private set; } = Currencies.Default;
    public string Locale { get; private set; } = "en";
    /// <summary>IANA time zone, used to highlight today's opening hours on the site.</summary>
    public string TimeZone { get; private set; } = DefaultTimeZone;
    public DateTimeOffset CreatedAt { get; private set; }

    public static Business Create(Guid ownerUserId, string name, Slug slug, DateTimeOffset now, string locale = "en", string currencyCode = Currencies.Default, string timeZone = DefaultTimeZone)
    {
        var business = new Business
        {
            OwnerUserId = ownerUserId,
            Name = Guard.Text(name, "name", 1, NameMax, "business.name"),
            Slug = slug,
            CreatedAt = now,
        };
        business.SetLocale(locale);
        business.SetCurrency(currencyCode);
        business.SetTimeZone(timeZone);
        return business;
    }

    public void UpdateProfile(string name, PhoneNumber? whatsApp, string? email, string? address, string? instagram, DateTimeOffset now)
    {
        Name = Guard.Text(name, "name", 1, NameMax, "business.name");
        WhatsApp = whatsApp;
        Email = Guard.OptionalText(email, "email", 254, "business.email");
        Address = Guard.OptionalText(address, "address", 200, "business.address");
        Instagram = Guard.OptionalText(instagram?.TrimStart('@'), "instagram", 30, "business.instagram");
        Raise(new BusinessChanged(Id, now));
    }

    public void SetLocale(string locale)
    {
        if (!Locales.Contains(locale))
        {
            throw new DomainException("business.locale", "Language must be en or ar.", "locale");
        }

        Locale = locale;
    }

    /// <summary>Sets the currency of the business's prices. Only codes in <see cref="Currencies.All"/> are allowed.</summary>
    public void SetCurrency(string currencyCode)
    {
        CurrencyCode = Currencies.Normalize(currencyCode);
    }

    /// <summary>An IANA time zone id such as "Europe/London" or "UTC".</summary>
    public void SetTimeZone(string timeZone)
    {
        var id = Guard.Text(timeZone, "timeZone", 1, 64, "business.timezone");
        if (!IsTimeZone(id))
        {
            throw new DomainException("business.timezone", TimeZoneMessage, "timeZone");
        }

        TimeZone = id;
    }

    public static bool IsTimeZone(string? id) =>
        !string.IsNullOrWhiteSpace(id) && TimeZoneInfo.TryFindSystemTimeZoneById(id.Trim(), out _);

    public void ChangeSlug(Slug slug, DateTimeOffset now)
    {
        Slug = slug;
        Raise(new BusinessChanged(Id, now));
    }
}
