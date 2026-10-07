using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Storefront.Application.Abstractions;
using Storefront.Domain.Accounts;
using Storefront.Domain.Billing;
using Storefront.Domain.Businesses;
using Storefront.Domain.Catalog;
using Storefront.Domain.Common;
using Storefront.Domain.Domains;
using Storefront.Domain.Media;
using Storefront.Domain.Sites;
using Storefront.Domain.Templates;
using Storefront.Infrastructure.Identity;
using Storefront.Infrastructure.Outbox;

namespace Storefront.Infrastructure.Persistence;

public sealed class StorefrontDbContext(DbContextOptions<StorefrontDbContext> options, ICurrentUser currentUser)
    : IdentityDbContext<AppUser, IdentityRole<Guid>, Guid>(options), IUnitOfWork
{
    /// <summary>Read by the global query filters on every save/query; EF evaluates it per query.</summary>
    internal Guid? CurrentBusinessId => currentUser.BusinessId;

    public DbSet<Business> Businesses => Set<Business>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Template> Templates => Set<Template>();
    public DbSet<Site> Sites => Set<Site>();
    public DbSet<MediaAsset> MediaAssets => Set<MediaAsset>();
    public DbSet<Plan> Plans => Set<Plan>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<DomainRequest> DomainRequests => Set<DomainRequest>();
    public DbSet<CustomDomain> CustomDomains => Set<CustomDomain>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();
    public DbSet<AuditEntry> AuditLog => Set<AuditEntry>();

    Task IUnitOfWork.SaveChangesAsync(CancellationToken ct) => SaveChangesAsync(ct);

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(StorefrontDbContext).Assembly);

        builder.Entity<AppUser>(user =>
        {
            user.HasIndex(u => u.NormalizedEmail).IsUnique();
            user.HasIndex(u => u.PhoneNumber).IsUnique().HasFilter("\"PhoneNumber\" IS NOT NULL");
        });

        // Tenant isolation: owners only ever see their own rows. Public and staff reads opt out with IgnoreQueryFilters().
        builder.Entity<Category>().HasQueryFilter(e => e.BusinessId == CurrentBusinessId);
        builder.Entity<Product>().HasQueryFilter(e => e.BusinessId == CurrentBusinessId);
        builder.Entity<Site>().HasQueryFilter(e => e.BusinessId == CurrentBusinessId);
        builder.Entity<MediaAsset>().HasQueryFilter(e => e.BusinessId == CurrentBusinessId);
        builder.Entity<Subscription>().HasQueryFilter(e => e.BusinessId == CurrentBusinessId);
        builder.Entity<DomainRequest>().HasQueryFilter(e => e.BusinessId == CurrentBusinessId);
    }

    protected override void ConfigureConventions(ModelConfigurationBuilder configuration)
    {
        configuration.Properties<decimal>().HavePrecision(12, 3);
        configuration.Properties<Slug>().HaveConversion<SlugConverter>().HaveMaxLength(Slug.MaxLength);
        configuration.Properties<DomainName>().HaveConversion<DomainNameConverter>().HaveMaxLength(253);
        configuration.Properties<PhoneNumber>().HaveConversion<PhoneNumberConverter>().HaveMaxLength(16);
    }
}
