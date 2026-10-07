using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Storefront.Infrastructure.Outbox;

public sealed class OutboxOptions
{
    public const string SectionName = "Outbox";

    public bool Enabled { get; set; } = true;
    public int PollSeconds { get; set; } = 2;
}

/// <summary>Polls the outbox and hands batches to <see cref="OutboxProcessor"/>.</summary>
internal sealed class OutboxDispatcher(IServiceScopeFactory scopes, IOptions<OutboxOptions> options, ILogger<OutboxDispatcher> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!options.Value.Enabled)
        {
            return;
        }

        var delay = TimeSpan.FromSeconds(Math.Max(1, options.Value.PollSeconds));
        while (!stoppingToken.IsCancellationRequested)
        {
            var handled = 0;
            try
            {
                await using var scope = scopes.CreateAsyncScope();
                handled = await scope.ServiceProvider.GetRequiredService<OutboxProcessor>().ProcessBatchAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Outbox dispatch failed");
            }

            if (handled < OutboxProcessor.BatchSize)
            {
                await Task.Delay(delay, stoppingToken).ContinueWith(_ => { }, CancellationToken.None);
            }
        }
    }
}
