using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Storefront.Application.Abstractions;
using Storefront.Application.Common;
using Storefront.Application.PublicSites;
using Storefront.Infrastructure.Email;
using Storefront.Infrastructure.Identity;
using Storefront.Infrastructure.Outbox;
using Storefront.Infrastructure.Persistence;
using Storefront.Infrastructure.Persistence.Repositories;
using Storefront.Infrastructure.Persistence.Seeding;
using Storefront.Infrastructure.PublicSites;
using Storefront.Infrastructure.Revalidation;
using Storefront.Infrastructure.Storage;
using Storefront.Infrastructure.Services;

namespace Storefront.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<StorefrontOptions>(configuration.GetSection(StorefrontOptions.SectionName));

        services.AddSingleton<DomainEventsInterceptor>();
        // Read the connection string when the context is built, so test hosts can override configuration.
        services.AddDbContext<StorefrontDbContext>((sp, options) => options
            .UseNpgsql(
                sp.GetRequiredService<IConfiguration>().GetConnectionString("Default")
                    ?? throw new InvalidOperationException("Connection string 'Default' is missing (ConnectionStrings__Default)."), npgsql => npgsql.MigrationsAssembly(typeof(StorefrontDbContext).Assembly.FullName))
            .AddInterceptors(sp.GetRequiredService<DomainEventsInterceptor>()));
        services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<StorefrontDbContext>());

        services.AddSingleton<IClock, SystemClock>();
        services.AddSingleton<IReservedSlugs, ReservedSlugs>();
        services.AddScoped<IOutbox, EfOutbox>();

        services.AddScoped<IBusinessRepository, BusinessRepository>();
        services.AddScoped<ICatalogRepository, CatalogRepository>();
        services.AddScoped<ISiteRepository, SiteRepository>();
        services.AddScoped<ITemplateRepository, TemplateRepository>();
        services.AddScoped<IBillingRepository, BillingRepository>();
        services.AddScoped<IDomainRepository, DomainRepository>();
        services.AddScoped<IMediaRepository, MediaRepository>();

        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();

        services.Configure<AuthOptions>(configuration.GetSection(AuthOptions.SectionName));
        services.AddIdentityCore<AppUser>(o =>
            {
                o.User.RequireUniqueEmail = true;
                o.Password.RequiredLength = 8;
                o.Password.RequireDigit = true;
                o.Password.RequireUppercase = true;
                o.Password.RequireLowercase = false;
                o.Password.RequireNonAlphanumeric = false;
                o.Lockout.AllowedForNewUsers = true;
                o.Lockout.MaxFailedAccessAttempts = 5;
                o.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
            })
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<StorefrontDbContext>()
            .AddErrorDescriber<FriendlyIdentityErrors>()
            .AddDefaultTokenProviders();
        services.Configure<DataProtectionTokenProviderOptions>(o => o.TokenLifespan = TimeSpan.FromHours(24));
        services.AddScoped<IIdentityService, IdentityService>();
        services.AddSingleton<ITokenService, TokenService>();
        services.AddSingleton<IPreviewTokens, PreviewTokens>();
        services.AddScoped<IPublicSiteReader, PublicSiteReader>();

        services.Configure<SmtpOptions>(configuration.GetSection(SmtpOptions.SectionName));
        services.AddSingleton<LogEmailSender>();
        services.AddSingleton<SmtpEmailSender>();
        services.AddSingleton<IEmailSender>(sp =>
            string.IsNullOrWhiteSpace(sp.GetRequiredService<IConfiguration>()[$"{SmtpOptions.SectionName}:Host"])
                ? sp.GetRequiredService<LogEmailSender>()
                : sp.GetRequiredService<SmtpEmailSender>());

        services.AddScoped<IAuditLog, EfAuditLog>();

        services.Configure<StorageOptions>(configuration.GetSection(StorageOptions.SectionName));
        services.AddSingleton<LocalFileStorage>();
        services.AddSingleton<S3FileStorage>();
        services.AddSingleton<IFileStorage>(sp =>
            string.Equals(sp.GetRequiredService<IConfiguration>()[$"{StorageOptions.SectionName}:Provider"], "s3", StringComparison.OrdinalIgnoreCase)
                ? sp.GetRequiredService<S3FileStorage>()
                : sp.GetRequiredService<LocalFileStorage>());

        services.Configure<RevalidationOptions>(configuration.GetSection(RevalidationOptions.SectionName));
        services.AddHttpClient<ISiteRevalidator, HttpSiteRevalidator>(c => c.Timeout = TimeSpan.FromSeconds(10));
        services.Configure<OutboxOptions>(configuration.GetSection(OutboxOptions.SectionName));
        services.AddScoped<OutboxProcessor>();
        services.AddHostedService<OutboxDispatcher>();

        services.AddScoped<TemplateRegistryImporter>();
        services.AddScoped<DevelopmentSeeder>();
        return services;
    }
}
