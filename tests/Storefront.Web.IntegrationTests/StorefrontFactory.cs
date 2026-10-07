using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace Storefront.Web.IntegrationTests;

/// <summary>Runs the real app against its own migrated and seeded test database.</summary>
public sealed class StorefrontFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    public TestDatabase Database { get; } = new();

    public Task InitializeAsync() => Database.InitializeAsync();

    public new async Task DisposeAsync()
    {
        await base.DisposeAsync();
        await Database.DisposeAsync();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:Default"] = Database.ConnectionString,
            ["Storefront:MigrateOnStartup"] = "true",
            ["Storefront:SeedSampleData"] = "true",
        }));
    }
}
