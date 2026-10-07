using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Storefront.Domain.Accounts;
using Storefront.Domain.Billing;
using Storefront.Domain.Businesses;
using Storefront.Domain.Catalog;
using Storefront.Domain.Domains;
using Storefront.Domain.Media;
using Storefront.Domain.Sites;
using Storefront.Domain.Templates;
using Storefront.Infrastructure.Identity;
using Storefront.Infrastructure.Outbox;

namespace Storefront.Infrastructure.Persistence.Configurations;

internal sealed class BusinessConfiguration : IEntityTypeConfiguration<Business>
{
    public void Configure(EntityTypeBuilder<Business> b)
    {
        b.Ignore(x => x.DomainEvents);
        b.Property(x => x.Name).HasMaxLength(Business.NameMax);
        b.Property(x => x.Slug).IsRequired();
        b.HasIndex(x => x.Slug).IsUnique();
        b.HasIndex(x => x.OwnerUserId).IsUnique();
        b.Property(x => x.Email).HasMaxLength(254);
        b.Property(x => x.Address).HasMaxLength(200);
        b.Property(x => x.Instagram).HasMaxLength(30);
        b.Property(x => x.CurrencyCode).HasMaxLength(3);
        b.Property(x => x.Locale).HasMaxLength(5);
        b.Property(x => x.TimeZone).HasMaxLength(64);
        b.HasOne<AppUser>().WithMany().HasForeignKey(x => x.OwnerUserId).OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> b)
    {
        b.Ignore(x => x.DomainEvents);
        b.Property(x => x.Name).HasMaxLength(Category.NameMax);
        // Names are unique per business, ignoring case.
        b.Property<string>("NameKey").IsRequired().HasMaxLength(Category.NameMax).HasComputedColumnSql("LOWER([Name])", stored: true);
        b.HasIndex("BusinessId", "NameKey").IsUnique();
        b.HasIndex(x => new { x.BusinessId, x.SortOrder });
        b.HasOne<Business>().WithMany().HasForeignKey(x => x.BusinessId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> b)
    {
        b.Ignore(x => x.DomainEvents);
        b.Property(x => x.Name).HasMaxLength(Product.NameMax);
        b.Property(x => x.Description).HasMaxLength(Product.DescriptionMax);
        b.Property(x => x.Label).HasMaxLength(20);
        b.Property(x => x.ImageUrl).HasMaxLength(2048);
        b.HasIndex(x => new { x.BusinessId, x.CategoryId, x.SortOrder });
        b.HasOne<Business>().WithMany().HasForeignKey(x => x.BusinessId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne<Category>().WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class TemplateConfiguration : IEntityTypeConfiguration<Template>
{
    public void Configure(EntityTypeBuilder<Template> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasMaxLength(40);
        b.Property(x => x.Name).HasMaxLength(60);
        b.Property(x => x.Category).HasMaxLength(40);
        b.Property(x => x.ThumbnailUrl).HasMaxLength(2048);
        b.Property(x => x.Description).HasMaxLength(300);
        b.HasIndex(x => x.Number).IsUnique();
    }
}

internal sealed class SiteConfiguration : IEntityTypeConfiguration<Site>
{
    public void Configure(EntityTypeBuilder<Site> b)
    {
        b.Ignore(x => x.DomainEvents);
        b.Ignore(x => x.IsPublished);
        b.HasIndex(x => x.BusinessId).IsUnique();
        b.Property(x => x.TemplateId).HasMaxLength(40);
        b.Property(x => x.PublishedTemplateId).HasMaxLength(40);
        b.HasOne<Business>().WithOne().HasForeignKey<Site>(x => x.BusinessId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne<Template>().WithMany().HasForeignKey(x => x.TemplateId).OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class MediaAssetConfiguration : IEntityTypeConfiguration<MediaAsset>
{
    public void Configure(EntityTypeBuilder<MediaAsset> b)
    {
        // Upload URLs are short (storage base + id). 800 keeps the (BusinessId, Url) index under SQL Server's 1700-byte key limit.
        b.Property(x => x.Url).HasMaxLength(800);
        b.Property(x => x.ContentType).HasMaxLength(40);
        b.HasIndex(x => new { x.BusinessId, x.Url });
        b.HasOne<Business>().WithMany().HasForeignKey(x => x.BusinessId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class PlanConfiguration : IEntityTypeConfiguration<Plan>
{
    public void Configure(EntityTypeBuilder<Plan> b)
    {
        b.HasKey(x => x.Code);
        b.Property(x => x.Code).HasMaxLength(20);
        b.Property(x => x.Name).HasMaxLength(40);
        b.Property(x => x.PriceUsd).HasPrecision(10, 2);
    }
}

internal sealed class SubscriptionConfiguration : IEntityTypeConfiguration<Subscription>
{
    public void Configure(EntityTypeBuilder<Subscription> b)
    {
        b.Ignore(x => x.DomainEvents);
        b.Ignore(x => x.IsLive);
        b.HasIndex(x => x.BusinessId).IsUnique();
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        b.Property(x => x.Provider).HasMaxLength(40);
        b.Property(x => x.ProviderRef).HasMaxLength(200);
        b.HasIndex(x => new { x.Provider, x.ProviderRef });
        b.HasOne<Business>().WithOne().HasForeignKey<Subscription>(x => x.BusinessId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne<Plan>().WithMany().HasForeignKey(x => x.PlanCode).OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class DomainRequestConfiguration : IEntityTypeConfiguration<DomainRequest>
{
    public void Configure(EntityTypeBuilder<DomainRequest> b)
    {
        b.Ignore(x => x.DomainEvents);
        b.Ignore(x => x.IsOpen);
        b.Property(x => x.Domain).IsRequired();
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        b.Property(x => x.StaffNote).HasMaxLength(1000);
        b.Property(x => x.HandledBy).HasMaxLength(254);
        b.HasIndex(x => new { x.BusinessId, x.Status });
        b.HasIndex(x => x.Status);
        b.HasOne<Business>().WithMany().HasForeignKey(x => x.BusinessId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class CustomDomainConfiguration : IEntityTypeConfiguration<CustomDomain>
{
    public void Configure(EntityTypeBuilder<CustomDomain> b)
    {
        b.HasKey(x => x.Domain);
        b.Property(x => x.Domain).HasMaxLength(253);
        b.HasIndex(x => x.BusinessId);
        b.HasOne<Business>().WithMany().HasForeignKey(x => x.BusinessId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> b)
    {
        b.Property(x => x.TokenHash).HasMaxLength(128);
        b.Property(x => x.DeviceName).HasMaxLength(100);
        b.HasIndex(x => x.TokenHash).IsUnique();
        b.HasIndex(x => x.UserId);
        b.HasOne<AppUser>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class OutboxMessageConfiguration : IEntityTypeConfiguration<OutboxMessage>
{
    public void Configure(EntityTypeBuilder<OutboxMessage> b)
    {
        b.Property(x => x.Type).HasMaxLength(100);
        b.Property(x => x.LastError).HasMaxLength(2000);
        b.HasIndex(x => new { x.NextAttemptAt, x.OccurredAt }).HasFilter("[ProcessedAt] IS NULL");
    }
}

internal sealed class AuditEntryConfiguration : IEntityTypeConfiguration<AuditEntry>
{
    public void Configure(EntityTypeBuilder<AuditEntry> b)
    {
        b.ToTable("AuditLog");
        b.Property(x => x.Action).HasMaxLength(60);
        b.Property(x => x.EntityType).HasMaxLength(60);
        b.Property(x => x.EntityId).HasMaxLength(100);
        b.HasIndex(x => new { x.BusinessId, x.At });
    }
}
