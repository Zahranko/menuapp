using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Storefront.Application.Abstractions;
using Storefront.Application.Common;
using Storefront.Infrastructure.Outbox;
using Storefront.Infrastructure.Persistence;
using Storefront.Infrastructure.Persistence.Repositories;
using Storefront.Infrastructure.Persistence.Seeding;
using Storefront.Infrastructure.Services;

namespace Storefront.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<StorefrontOptions>(configuration.GetSection(StorefrontOptions.SectionName));

        var connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("Connection string 'Default' is missing (ConnectionStrings__Default).");

        services.AddSingleton<DomainEventsInterceptor>();
        services.AddDbContext<StorefrontDbContext>((sp, options) => options
            .UseNpgsql(connectionString, npgsql => npgsql.MigrationsAssembly(typeof(StorefrontDbContext).Assembly.FullName))
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

        services.AddScoped<TemplateRegistryImporter>();
        services.AddScoped<DevelopmentSeeder>();
        return services;
    }
}
