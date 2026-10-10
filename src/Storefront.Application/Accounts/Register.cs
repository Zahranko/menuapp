using FluentValidation;
using Microsoft.Extensions.Options;
using Storefront.Application.Abstractions;
using Storefront.Application.Common;
using Storefront.Domain.Billing;
using Storefront.Domain.Businesses;
using Storefront.Domain.Common;
using Storefront.Domain.Sites;

namespace Storefront.Application.Accounts;

public sealed record Register(string BusinessName, string Email, string Phone, string Password, string? DeviceName = null, string? Locale = null);

public sealed class RegisterValidator : AbstractValidator<Register>
{
    public RegisterValidator()
    {
        RuleFor(x => x.BusinessName).Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Enter your business name.")
            .MaximumLength(Business.NameMax).WithMessage("Business name can be at most 60 characters.");
        RuleFor(x => x.Email).Cascade(CascadeMode.Stop).ValidEmail();
        RuleFor(x => x.Phone).Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Enter your phone number.")
            .Must(BeAPhoneNumber).WithMessage("Enter a full phone number with the country code.");
        RuleFor(x => x.Password).Cascade(CascadeMode.Stop).StrongPassword();
        RuleFor(x => x.Locale).Must(l => l is null || Business.Locales.Contains(l)).WithMessage("Language must be en or ar.");
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

public sealed class RegisterHandler(
    IValidator<Register> validator,
    IIdentityService identity,
    IBusinessRepository businesses,
    ITemplateRepository templates,
    ISiteRepository sites,
    IBillingRepository billing,
    IReservedSlugs reserved,
    SlugAvailabilityHandler slugs,
    SessionIssuer sessions,
    IUnitOfWork uow,
    IClock clock,
    IOptions<BillingOptions> billingOptions)
{
    public const string DefaultTemplateId = "souq";
    public static readonly TimeSpan TrialLength = TimeSpan.FromDays(14);

    public async Task<Result<AuthResponse>> Handle(Register cmd, CancellationToken ct)
    {
        if (await validator.CheckAsync(cmd, ct) is { } invalid)
        {
            return invalid;
        }

        var slugValue = Slug.FromBusinessName(cmd.BusinessName);
        if (await slugs.ProblemAsync(slugValue, ct) is { } slugProblem)
        {
            return Error.Conflict("slug.unavailable", slugProblem, "businessName");
        }

        var template = await templates.GetAsync(DefaultTemplateId, ct)
            ?? (await templates.ListAsync(activeOnly: true, ct)).FirstOrDefault();
        if (template is null)
        {
            throw new InvalidOperationException("No templates are installed; import the template registry first.");
        }

        return await uow.InTransactionAsync(async () =>
        {
            var phone = PhoneNumber.Create(cmd.Phone);
            var user = await identity.CreateUserAsync(cmd.Email.Trim(), phone.Value, cmd.Password, ct);
            if (!user.IsSuccess)
            {
                return Result<AuthResponse>.Failure(user.Error!);
            }

            var now = clock.UtcNow;
            var business = Business.Create(user.Value.Id, cmd.BusinessName, Slug.Create(slugValue, reserved.All), now, cmd.Locale ?? "en");
            business.UpdateProfile(cmd.BusinessName, phone, cmd.Email.Trim(), null, null, now);
            business.ClearDomainEvents();
            businesses.Add(business);
            sites.Add(Site.Create(business.Id, template.Id, template.DefaultSettings, now));
            billing.Add(billingOptions.Value.TestMode
                ? Subscription.Start(business.Id, Plan.Pro, SubscriptionStatus.Active, "test", null, null)
                : Subscription.Start(business.Id, Plan.Basic, SubscriptionStatus.Trialing, "none", null, now + TrialLength));
            await uow.SaveChangesAsync(ct);

            var session = await sessions.IssueAsync(user.Value, business, cmd.DeviceName, ct);
            return Result<AuthResponse>.Success(session);
        }, ct);
    }
}
