using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Storefront.Application.Abstractions;
using Storefront.Domain.Billing;
using Storefront.Domain.Businesses;
using Storefront.Domain.Catalog;
using Storefront.Domain.Common;
using Storefront.Domain.Sites;
using Storefront.Infrastructure.Identity;

namespace Storefront.Infrastructure.Persistence.Seeding;

/// <summary>
/// Development data: the two plans, templates from the registry, and the sample business "Vanilla Menu"
/// with the prototype's categories and products. Safe to run any number of times.
/// </summary>
public sealed class DevelopmentSeeder(StorefrontDbContext db, TemplateRegistryImporter templates, IClock clock, ILogger<DevelopmentSeeder> logger)
{
    public const string SampleOwnerEmail = "owner@example.com";
    public const string SampleOwnerPassword = "Sample-pass-123";
    public const string SampleSlug = "vanillamenu";

    private static readonly (string Category, string Name, string Description, decimal Price, string? Label, bool Featured)[] SampleProducts =
    [
        ("Coffee", "Vanilla latte", "Double shot, Madagascar vanilla, oat or full milk", 3.50m, ProductLabel.Signature, true),
        ("Coffee", "Spanish latte", "Condensed milk, velvety and sweet", 3.75m, null, false),
        ("Coffee", "Cardamom cortado", "Equal parts espresso and warm milk, a pinch of cardamom", 2.75m, ProductLabel.New, false),
        ("Coffee", "Iced mocha", "Dark chocolate, cold milk, lots of ice", 3.95m, null, false),
        ("Tea", "Sage and mint tea", "Fresh maramiya and mint, served in a glass pot", 2.00m, null, false),
        ("Tea", "Karak chai", "Black tea slow cooked with milk and spices", 2.50m, null, false),
        ("Bakery", "Pistachio croissant", "Butter croissant filled with pistachio cream", 2.25m, ProductLabel.BestSeller, true),
        ("Bakery", "Za'atar croissant", "Olive oil, za'atar and sesame", 1.95m, ProductLabel.Vegan, false),
        ("Bakery", "Date and tahini cookie", "Chewy, salted, baked every morning", 1.50m, null, false),
        ("Desserts", "Saffron cake", "Saffron sponge with cardamom cream", 4.00m, null, false),
        ("Desserts", "Kunafa cheesecake", "Baked cheesecake on a crisp kunafa base", 4.50m, ProductLabel.Signature, true),
    ];

    public async Task SeedAsync(CancellationToken ct)
    {
        await SeedPlansAsync(ct);
        await templates.ImportAsync(ct);
        await SeedSampleBusinessAsync(ct);
    }

    private async Task SeedPlansAsync(CancellationToken ct)
    {
        var plans = await db.Plans.ToDictionaryAsync(p => p.Code, ct);
        Upsert(Plan.Basic, "Basic", 5m, false);
        Upsert(Plan.Pro, "Pro", 10m, true);
        await db.SaveChangesAsync(ct);

        void Upsert(string code, string name, decimal price, bool customDomain)
        {
            if (plans.TryGetValue(code, out var plan))
            {
                plan.Update(name, price, customDomain);
            }
            else
            {
                db.Plans.Add(Plan.Create(code, name, price, customDomain));
            }
        }
    }

    private async Task SeedSampleBusinessAsync(CancellationToken ct)
    {
        var slug = Slug.FromStorage(SampleSlug);
        if (await db.Businesses.AnyAsync(b => b.Slug == slug, ct))
        {
            return;
        }

        var template = await db.Templates.OrderBy(t => t.Number).FirstOrDefaultAsync(ct);
        if (template is null)
        {
            logger.LogWarning("No templates in the database; the sample business was not seeded");
            return;
        }

        var now = clock.UtcNow;
        var owner = new AppUser
        {
            UserName = SampleOwnerEmail,
            NormalizedUserName = SampleOwnerEmail.ToUpperInvariant(),
            Email = SampleOwnerEmail,
            NormalizedEmail = SampleOwnerEmail.ToUpperInvariant(),
            EmailConfirmed = true,
            PhoneNumber = "+962790000000",
            CreatedAt = now,
        };
        owner.PasswordHash = new PasswordHasher<AppUser>().HashPassword(owner, SampleOwnerPassword);
        db.Users.Add(owner);

        var business = Business.Create(owner.Id, "Vanilla Menu", slug, now);
        business.UpdateProfile("Vanilla Menu", PhoneNumber.Create("+962 79 000 0000"), "hello@example.com", "Rainbow Street 21, Jabal Amman", "vanillamenu", now);
        db.Businesses.Add(business);

        var categories = SampleProducts.Select(p => p.Category).Distinct()
            .Select((name, i) => Category.Create(business.Id, name, i, now))
            .ToDictionary(c => c.Name);
        db.Categories.AddRange(categories.Values);

        var order = 0;
        foreach (var p in SampleProducts)
        {
            db.Products.Add(Product.Create(business.Id, categories[p.Category].Id,
                new ProductDetails(p.Name, p.Description, p.Price, p.Label, IsFeatured: p.Featured), business.CurrencyCode, order++, now));
        }

        var site = Site.Create(business.Id, template.Id, template.DefaultSettings, now);
        site.Publish(now);
        db.Sites.Add(site);
        db.Subscriptions.Add(Subscription.Start(business.Id, Plan.Basic, SubscriptionStatus.Trialing, "fake", null, now.AddDays(14)));

        // Seed data is not a change anyone needs delivered.
        foreach (var aggregate in db.ChangeTracker.Entries<AggregateRoot>())
        {
            aggregate.Entity.ClearDomainEvents();
        }

        await db.SaveChangesAsync(ct);
        logger.LogInformation("Seeded sample business {Slug}", SampleSlug);
    }
}
