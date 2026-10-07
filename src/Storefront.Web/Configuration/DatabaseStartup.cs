using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Storefront.Application.Common;
using Storefront.Infrastructure.Persistence;
using Storefront.Infrastructure.Persistence.Seeding;

namespace Storefront.Web.Configuration;

public static class DatabaseStartup
{
    /// <summary>
    /// Development and test: apply migrations and (when Storefront:SeedSampleData is true) seed sample data.
    /// Other environments always re-import the template registry so new templates appear without code changes.
    /// </summary>
    public static async Task PrepareDatabaseAsync(this WebApplication app)
    {
        if (app.Configuration.GetValue("Storefront:SkipDatabaseStartup", false))
        {
            return;
        }

        await using var scope = app.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<StorefrontDbContext>();
        var options = scope.ServiceProvider.GetRequiredService<IOptions<StorefrontOptions>>().Value;

        if (app.Environment.IsDevelopment() || app.Configuration.GetValue("Storefront:MigrateOnStartup", false))
        {
            await db.Database.MigrateAsync();
        }

        if (options.SeedSampleData)
        {
            await scope.ServiceProvider.GetRequiredService<DevelopmentSeeder>().SeedAsync(CancellationToken.None);
        }
        else
        {
            await scope.ServiceProvider.GetRequiredService<TemplateRegistryImporter>().ImportAsync(CancellationToken.None);
        }
    }
}
