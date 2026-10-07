using FluentValidation;
using Microsoft.Extensions.Options;
using Storefront.Application.Abstractions;
using Storefront.Application.Accounts;
using Storefront.Application.Common;
using Storefront.Domain.Businesses;
using Storefront.Domain.Common;

namespace Storefront.Application.Businesses;

public sealed class GetBusinessHandler(ICurrentUser currentUser, IBusinessRepository businesses, IOptions<BrandOptions> brand)
{
    public async Task<Result<BusinessDto>> Handle(CancellationToken ct)
    {
        var business = currentUser.BusinessId is { } id ? await businesses.GetAsync(id, ct) : null;
        return business is null
            ? Error.NotFound("business.notFound", "Business not found.")
            : BusinessDto.From(business, brand.Value.Domain);
    }
}

/// <summary>Business info shown in the site header, contact section and footer. The slug never changes here.</summary>
public sealed record UpdateBusiness(string Name, string? WhatsApp, string? Email, string? Address, string? Instagram, string? Locale, string? TimeZone);

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
        RuleFor(x => x.Instagram!).Matches("^@?[A-Za-z0-9._]{1,30}$").WithMessage("Enter your Instagram username, like vanillamenu.")
            .When(x => !string.IsNullOrWhiteSpace(x.Instagram));
        RuleFor(x => x.Locale).Must(l => l is null || Business.Locales.Contains(l)).WithMessage("Language must be en or ar.");
        RuleFor(x => x.TimeZone!).Must(BeATimeZone).WithMessage("Choose a time zone from the list.")
            .When(x => !string.IsNullOrWhiteSpace(x.TimeZone));
    }

    private static bool BeATimeZone(string id) => TimeZoneInfo.TryFindSystemTimeZoneById(id, out _);
}

public sealed class UpdateBusinessHandler(IValidator<UpdateBusiness> validator, ICurrentUser currentUser, IBusinessRepository businesses, IUnitOfWork uow, IClock clock, IOptions<BrandOptions> brand)
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
            if (cmd.Locale is not null)
            {
                business.SetLocale(cmd.Locale);
            }

            if (!string.IsNullOrWhiteSpace(cmd.TimeZone))
            {
                business.SetTimeZone(cmd.TimeZone);
            }
        }
        catch (DomainException ex)
        {
            return Error.FromDomain(ex);
        }

        await uow.SaveChangesAsync(ct);
        return BusinessDto.From(business, brand.Value.Domain);
    }
}
