using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Storefront.Application.Abstractions;
using Storefront.Application.Ai;
using Storefront.Application.Common;
using Storefront.Application.PublicSites;
using Storefront.Infrastructure.Ai;
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
        services.Configure<BillingOptions>(configuration.GetSection(BillingOptions.SectionName));
        services.AddScoped<IPaymentProvider, Billing.FakePaymentProvider>();

        services.AddSingleton<DomainEventsInterceptor>();
        // Read the connection string when the context is built, so test hosts can override configuration.
        services.AddDbContext<StorefrontDbContext>((sp, options) => options
            .UseSqlServer(
                sp.GetRequiredService<IConfiguration>().GetConnectionString("Default")
                    ?? throw new InvalidOperationException("Connection string 'Default' is missing (ConnectionStrings__Default)."),
                sql => sql.MigrationsAssembly(typeof(StorefrontDbContext).Assembly.FullName))
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
        services.AddScoped<IAiUsageRepository, AiUsageRepository>();

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
        // Reset links are signed with Data Protection keys. Kept on disk (not in memory) so links survive app pool recycles
        // and restarts. "DataProtection:KeysPath" overrides the folder; the default sits under App_Data, which is gitignored,
        // never served (only wwwroot and the media folder are) and left alone by the deploy.
        var keysPath = configuration["DataProtection:KeysPath"] is { Length: > 0 } configured
            ? configured
            : Path.Combine(configuration["contentRoot"] ?? AppContext.BaseDirectory, "App_Data", "keys");
        services.AddDataProtection()
            .SetApplicationName("Storefront")
            .PersistKeysToFileSystem(new DirectoryInfo(Path.GetFullPath(keysPath)));
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
        services.AddHostedService<EmailConfigurationCheck>();

        services.AddScoped<IAuditLog, EfAuditLog>();

        services.Configure<StorageOptions>(configuration.GetSection(StorageOptions.SectionName));
        services.AddSingleton<IImageOptimizer, Media.SkiaImageOptimizer>();
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

        // The AI helper: DeepSeek when "Ai:DeepSeek:ApiKey" is set, else Gemini when "Ai:Gemini:ApiKey" is set, otherwise
        // switched off. Keys are read when resolved, so test hosts can override them.
        services.Configure<AiOptions>(configuration.GetSection(AiOptions.SectionName));
        services.Configure<DeepSeekOptions>(configuration.GetSection(DeepSeekOptions.SectionName));
        services.AddHttpClient<DeepSeekAssistant>((sp, c) =>
                c.Timeout = TimeSpan.FromSeconds(Math.Clamp(sp.GetRequiredService<IOptions<DeepSeekOptions>>().Value.TimeoutSeconds, 5, 120)))
            .RedactLoggedHeaders(["Authorization"]);
        services.Configure<GeminiOptions>(configuration.GetSection(GeminiOptions.SectionName));
        services.AddHttpClient<GeminiAssistant>((sp, c) =>
                c.Timeout = TimeSpan.FromSeconds(Math.Clamp(sp.GetRequiredService<IOptions<GeminiOptions>>().Value.TimeoutSeconds, 5, 120)))
            .RedactLoggedHeaders([GeminiAssistant.KeyHeader]);
        services.AddSingleton<DisabledAiAssistant>();
        services.AddScoped<IAiAssistant>(sp =>
            !string.IsNullOrWhiteSpace(sp.GetRequiredService<IOptions<DeepSeekOptions>>().Value.ApiKey) ? sp.GetRequiredService<DeepSeekAssistant>()
            : !string.IsNullOrWhiteSpace(sp.GetRequiredService<IOptions<GeminiOptions>>().Value.ApiKey) ? sp.GetRequiredService<GeminiAssistant>()
            : sp.GetRequiredService<DisabledAiAssistant>());

        services.AddScoped<TemplateRegistryImporter>();
        services.AddScoped<ReferenceDataSeeder>();
        services.AddScoped<DevelopmentSeeder>();
        return services;
    }
}
