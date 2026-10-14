using FluentValidation;
using Microsoft.Extensions.Options;
using Storefront.Application.Abstractions;
using Storefront.Application.Accounts;
using Storefront.Application.Common;
using Storefront.Domain.Businesses;
using Storefront.Domain.Common;

namespace Storefront.Application.Businesses;

public sealed class GetBusinessHandler(ICurrentUser currentUser, IBusinessRepository businesses, SiteLinks links)
{
    public async Task<Result<BusinessDto>> Handle(CancellationToken ct)
    {
        var business = currentUser.BusinessId is { } id ? await businesses.GetAsync(id, ct) : null;
        return business is null
            ? Error.NotFound("business.notFound", "Business not found.")
            : BusinessDto.From(business, links);
    }
}

/// <summary>Business info shown in the site header, contact section and footer. The slug never changes here.</summary>
/// <param name="CurrencyCode">
/// Optional. A new currency re-labels every product price in it, keeping the numbers (no exchange rate) and rounding
/// each one to the new currency's decimals.
/// </param>
/// <param name="Phone">Optional. The number customers call; the site's "Call us" uses the WhatsApp number when it is empty.</param>
/// <param name="Facebook">Optional. A Facebook page name or link; stored as the page name.</param>
/// <param name="TikTok">Optional. A TikTok username (with or without @) or profile link.</param>
/// <param name="Snapchat">Optional. A Snapchat username or snapchat.com/add link.</param>
public sealed record UpdateBusiness(
    string Name,
    string? WhatsApp,
    string? Email,
    string? Address,
    string? Instagram,
    string? Locale,
    string? TimeZone,
    string? CurrencyCode = null,
    string? Phone = null,
    string? Facebook = null,
    string? TikTok = null,
    string? Snapchat = null);

public sealed class UpdateBusinessValidator : AbstractValidator<UpdateBusiness>
{
    public UpdateBusinessValidator()
    {
        RuleFor(x => x.Name).Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Enter your business name.")
            .MaximumLength(Business.NameMax).WithMessage("Business name can be at most 60 characters.");
        RuleFor(x => x.Email!).Matches(Rules.EmailPattern).WithMessage("Check the email format, like name@business.com.")
            .MaximumLength(254).When(x => !string.IsNullOrWhiteSpace(x.Email));
        RuleFor(x => x.Address).MaximumLength(200).WithMessage("Address can be at most 200 characters.");
        RuleFor(x => x.Instagram).Must(v => SocialAccounts.IsValid(SocialAccounts.Instagram, v)).WithMessage(SocialAccounts.InstagramMessage);
        RuleFor(x => x.Phone!).Must(BeAPhoneNumber).WithMessage("Enter the number with its country code, starting with +.")
            .When(x => !string.IsNullOrWhiteSpace(x.Phone));
        RuleFor(x => x.Facebook).Must(v => SocialAccounts.IsValid(SocialAccounts.Facebook, v)).WithMessage(SocialAccounts.FacebookMessage);
        RuleFor(x => x.TikTok).Must(v => SocialAccounts.IsValid(SocialAccounts.TikTok, v)).WithMessage(SocialAccounts.TikTokMessage);
        RuleFor(x => x.Snapchat).Must(v => SocialAccounts.IsValid(SocialAccounts.Snapchat, v)).WithMessage(SocialAccounts.SnapchatMessage);
        RuleFor(x => x.Locale).Must(l => l is null || Business.Locales.Contains(l)).WithMessage("Language must be en or ar.");
        RuleFor(x => x.TimeZone!).Must(Business.IsTimeZone).WithMessage(Business.TimeZoneMessage)
            .When(x => !string.IsNullOrWhiteSpace(x.TimeZone));
        RuleFor(x => x.CurrencyCode!).Must(Currencies.IsSupported).WithMessage(Currencies.UnsupportedMessage)
            .When(x => !string.IsNullOrWhiteSpace(x.CurrencyCode));
    }

    private static bool BeAPhoneNumber(string phone)
    {
        try
        {
            PhoneNumber.Create(phone);
            return true;
        }
        catch (DomainException)
        {
            return false;
        }
    }
}

public sealed class UpdateBusinessHandler(
    IValidator<UpdateBusiness> validator,
    ICurrentUser currentUser,
    IBusinessRepository businesses,
    ICatalogRepository catalog,
    IUnitOfWork uow,
    IClock clock,
    SiteLinks links)
{
    public async Task<Result<BusinessDto>> Handle(UpdateBusiness cmd, CancellationToken ct)
    {
        if (await validator.CheckAsync(cmd, ct) is { } invalid)
        {
            return invalid;
        }

        var business = currentUser.BusinessId is { } id ? await businesses.GetAsync(id, ct) : null;
        if (business is null)
        {
            return Error.NotFound("business.notFound", "Business not found.");
        }

        try
        {
            var whatsApp = string.IsNullOrWhiteSpace(cmd.WhatsApp) ? null : PhoneNumber.Create(cmd.WhatsApp, "whatsApp");
            business.UpdateProfile(cmd.Name, whatsApp, cmd.Email, cmd.Address, cmd.Instagram, clock.UtcNow);
            var phone = string.IsNullOrWhiteSpace(cmd.Phone) ? null : PhoneNumber.Create(cmd.Phone, "phone");
            business.UpdateContactAccounts(phone, cmd.Facebook, cmd.TikTok, cmd.Snapchat, clock.UtcNow);
            if (cmd.Locale is not null)
            {
                business.SetLocale(cmd.Locale);
            }

            if (!string.IsNullOrWhiteSpace(cmd.TimeZone))
            {
                business.SetTimeZone(cmd.TimeZone);
            }

            if (!string.IsNullOrWhiteSpace(cmd.CurrencyCode))
            {
                var currency = Currencies.Normalize(cmd.CurrencyCode);
                if (currency != business.CurrencyCode)
                {
                    business.SetCurrency(currency);
                    var now = clock.UtcNow;
                    foreach (var product in await catalog.ListProductsAsync(null, ct))
                    {
                        product.ChangeCurrency(currency, now);
                    }
                }
            }
        }
        catch (DomainException ex)
        {
            return Error.FromDomain(ex);
        }

        await uow.SaveChangesAsync(ct);
        return BusinessDto.From(business, links);
    }
}
