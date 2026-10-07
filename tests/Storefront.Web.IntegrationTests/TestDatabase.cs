using Microsoft.Data.SqlClient;

namespace Storefront.Web.IntegrationTests;

/// <summary>A throwaway SQL Server database per fixture, created on the server from ConnectionStrings__Default.</summary>
public sealed class TestDatabase : IAsyncLifetime
{
    private static readonly string BaseConnectionString =
        Environment.GetEnvironmentVariable("ConnectionStrings__Default")
        ?? "Server=localhost;Database=storefront;User Id=sa;Password=Storefront_dev1;TrustServerCertificate=True";

    public string Name { get; } = $"storefront_test_{Guid.NewGuid():N}";

    public string ConnectionString => new SqlConnectionStringBuilder(BaseConnectionString) { InitialCatalog = Name, Pooling = false }.ConnectionString;

    public async Task InitializeAsync() => await ExecuteOnServer($"CREATE DATABASE [{Name}]");

    public async Task DisposeAsync()
    {
        SqlConnection.ClearAllPools();
        await ExecuteOnServer($"IF DB_ID('{Name}') IS NOT NULL BEGIN ALTER DATABASE [{Name}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [{Name}]; END");
    }

    private static async Task ExecuteOnServer(string sql)
    {
        var builder = new SqlConnectionStringBuilder(BaseConnectionString) { InitialCatalog = "master", Pooling = false };
        await using var connection = new SqlConnection(builder.ConnectionString);
        await connection.OpenAsync();
        await using var command = new SqlCommand(sql, connection);
        await command.ExecuteNonQueryAsync();
    }
}
