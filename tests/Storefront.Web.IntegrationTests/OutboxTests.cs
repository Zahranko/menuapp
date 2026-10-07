using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Storefront.Application.Catalog;
using Storefront.Infrastructure.Outbox;
using Storefront.Infrastructure.Persistence;

namespace Storefront.Web.IntegrationTests;

public class OutboxTests(StorefrontFactory factory) : IClassFixture<StorefrontFactory>
{
    private async Task<int> ProcessAsync()
    {
        await using var scope = factory.Services.CreateAsyncScope();
        return await scope.ServiceProvider.GetRequiredService<OutboxProcessor>().ProcessBatchAsync(CancellationToken.None);
    }

    [Fact]
    public async Task Content_changes_revalidate_the_site_once_per_business_and_retry_on_failure()
    {
        await ProcessAsync();
        factory.Revalidations.Calls.Clear();

        var auth = await Api.RegisterAsync(factory.CreateClient());
        var client = factory.CreateClient().Authorized(auth.AccessToken);
        var created = await client.PostAsJsonAsync("/api/v1/categories", new { name = "Coffee" });
        var coffee = (await created.Content.ReadFromJsonAsync<CategoryDto>(Api.Json))!;
        await client.PostAsJsonAsync("/api/v1/products", new { categoryId = coffee.Id, name = "Latte", price = 3m });
        await client.PostAsJsonAsync("/api/v1/products", new { categoryId = coffee.Id, name = "Mocha", price = 3m });

        factory.Revalidations.FailuresLeft = 1;
        await ProcessAsync();
        Assert.Empty(factory.Revalidations.Calls);

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<StorefrontDbContext>();
            var pending = await db.OutboxMessages.Where(m => m.ProcessedAt == null).ToListAsync();
            Assert.NotEmpty(pending);
            Assert.All(pending, m => Assert.Equal(1, m.Attempts));
            Assert.All(pending, m => Assert.NotNull(m.NextAttemptAt));

            // Pretend the backoff has passed.
            foreach (var message in pending)
            {
                message.NextAttemptAt = DateTimeOffset.UtcNow.AddSeconds(-1);
            }

            await db.SaveChangesAsync();
        }

        await ProcessAsync();
        var call = Assert.Single(factory.Revalidations.Calls);
        Assert.Equal([$"site:{auth.Business.Slug}"], call);

        await using var check = factory.Services.CreateAsyncScope();
        Assert.False(await check.ServiceProvider.GetRequiredService<StorefrontDbContext>().OutboxMessages.AnyAsync(m => m.ProcessedAt == null));
    }

    [Fact]
    public void Backoff_grows_and_is_capped()
    {
        Assert.Equal(TimeSpan.FromSeconds(5), OutboxProcessor.Backoff(1));
        Assert.Equal(TimeSpan.FromSeconds(10), OutboxProcessor.Backoff(2));
        Assert.Equal(TimeSpan.FromHours(1), OutboxProcessor.Backoff(20));
    }
}
