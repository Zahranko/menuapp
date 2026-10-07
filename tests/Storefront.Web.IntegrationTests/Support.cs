using System.Collections.Concurrent;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Storefront.Application.Abstractions;
using Storefront.Application.Accounts;

namespace Storefront.Web.IntegrationTests;

public sealed class CapturingEmailSender : IEmailSender
{
    public ConcurrentQueue<EmailMessage> Sent { get; } = new();

    public Task SendAsync(EmailMessage message, CancellationToken ct)
    {
        Sent.Enqueue(message);
        return Task.CompletedTask;
    }
}

public sealed class CapturingRevalidator : ISiteRevalidator
{
    public ConcurrentQueue<string[]> Calls { get; } = new();

    public int FailuresLeft { get; set; }

    public Task RevalidateAsync(IReadOnlyCollection<string> tags, CancellationToken ct)
    {
        if (FailuresLeft > 0)
        {
            FailuresLeft--;
            throw new HttpRequestException("Next.js is down");
        }

        Calls.Enqueue(tags.ToArray());
        return Task.CompletedTask;
    }
}

public static class Api
{
    private static int _counter;

    public static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    /// <summary>A unique business name, email and phone per call so tests can share one database.</summary>
    public static (string Name, string Email, string Phone) NewOwner()
    {
        var n = Interlocked.Increment(ref _counter);
        var stamp = $"{DateTime.UtcNow:HHmmssfff}{n}";
        return ($"Test Cafe {stamp}", $"owner{stamp}@example.com", $"+9627{stamp.PadLeft(8, '0')[^8..]}");
    }

    public static async Task<AuthResponse> RegisterAsync(HttpClient client, string? name = null, string password = "Sunrise2026")
    {
        var owner = NewOwner();
        var response = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            businessName = name ?? owner.Name,
            email = owner.Email,
            phone = owner.Phone,
            password,
        });
        await EnsureSuccess(response);
        return (await response.Content.ReadFromJsonAsync<AuthResponse>(Json))!;
    }

    public static HttpClient Authorized(this HttpClient client, string accessToken)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        return client;
    }

    public static async Task EnsureSuccess(HttpResponseMessage response)
    {
        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException($"{(int)response.StatusCode} {response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
        }
    }

    public static async Task<JsonElement> ProblemAsync(HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<JsonElement>(Json));
}
