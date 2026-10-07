using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Storefront.Application.Abstractions;

namespace Storefront.Web.IntegrationTests;

/// <summary>Runs the real app against its own migrated and seeded test database.</summary>
public class StorefrontFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    public TestDatabase Database { get; } = new();

    public CapturingEmailSender Emails { get; } = new();

    /// <summary>Overrides for one fixture, applied after the defaults below.</summary>
    protected virtual IDictionary<string, string?> ExtraSettings => new Dictionary<string, string?>();

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
            ["Auth:SigningKey"] = "integration-tests-signing-key-0123456789abcdef",
            ["RateLimits:AuthPerMinute"] = "10000",
            ["RateLimits:SlugCheckPerMinute"] = "10000",
            ["RateLimits:PublicPerMinute"] = "10000",
        }).AddInMemoryCollection(ExtraSettings));
        builder.ConfigureTestServices(services => services.AddSingleton<IEmailSender>(Emails));
    }
}
