using Npgsql;

namespace Storefront.Web.IntegrationTests;

/// <summary>A throwaway PostgreSQL database per fixture, created on the server from ConnectionStrings__Default.</summary>
public sealed class TestDatabase : IAsyncLifetime
{
    private static readonly string BaseConnectionString =
        Environment.GetEnvironmentVariable("ConnectionStrings__Default")
        ?? "Host=localhost;Database=storefront;Username=storefront;Password=storefront";

    public string Name { get; } = $"storefront_test_{Guid.NewGuid():N}";

    public string ConnectionString => new NpgsqlConnectionStringBuilder(BaseConnectionString) { Database = Name, Pooling = false }.ConnectionString;

    public async Task InitializeAsync() => await ExecuteOnServer($"CREATE DATABASE \"{Name}\"");

    public async Task DisposeAsync()
    {
        NpgsqlConnection.ClearAllPools();
        await ExecuteOnServer($"DROP DATABASE IF EXISTS \"{Name}\" WITH (FORCE)");
    }

    private static async Task ExecuteOnServer(string sql)
    {
        var builder = new NpgsqlConnectionStringBuilder(BaseConnectionString) { Database = "postgres", Pooling = false };
        await using var connection = new NpgsqlConnection(builder.ConnectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        await command.ExecuteNonQueryAsync();
    }
}
