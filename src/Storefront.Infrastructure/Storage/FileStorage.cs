using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;
using Storefront.Application.Abstractions;

namespace Storefront.Infrastructure.Storage;

/// <summary>
/// Settings under "Storage". Provider "s3" (any S3-compatible service, for example Cloudflare R2) or "local"
/// (development: files under LocalRoot, served by the API at /media/...). PublicBaseUrl is the URL prefix customers see.
/// </summary>
public sealed class StorageOptions
{
    public const string SectionName = "Storage";

    public string Provider { get; set; } = "local";
    public string LocalRoot { get; set; } = "App_Data/media";
    public string PublicBaseUrl { get; set; } = "http://localhost:5080/media";
    public string? ServiceUrl { get; set; }
    public string? Bucket { get; set; }
    public string? AccessKey { get; set; }
    public string? SecretKey { get; set; }
    public string Region { get; set; } = "auto";
}

internal sealed class LocalFileStorage(IOptions<StorageOptions> options) : IFileStorage
{
    public string Root => Path.GetFullPath(options.Value.LocalRoot);

    public async Task<StoredFile> SaveAsync(string key, Stream content, string contentType, CancellationToken ct)
    {
        var path = Path.GetFullPath(Path.Combine(Root, key));
        if (!path.StartsWith(Root, StringComparison.Ordinal))
        {
            throw new ArgumentException("Invalid storage key.", nameof(key));
        }

        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        await using var file = File.Create(path);
        await content.CopyToAsync(file, ct);
        return new StoredFile(key, $"{options.Value.PublicBaseUrl.TrimEnd('/')}/{key}");
    }
}

internal sealed class S3FileStorage(IOptions<StorageOptions> options) : IFileStorage, IDisposable
{
    private readonly AmazonS3Client _client = new(
        new BasicAWSCredentials(options.Value.AccessKey, options.Value.SecretKey),
        new AmazonS3Config { ServiceURL = options.Value.ServiceUrl, ForcePathStyle = true, AuthenticationRegion = options.Value.Region });

    public async Task<StoredFile> SaveAsync(string key, Stream content, string contentType, CancellationToken ct)
    {
        await _client.PutObjectAsync(new PutObjectRequest
        {
            BucketName = options.Value.Bucket,
            Key = key,
            InputStream = content,
            ContentType = contentType,
            Headers = { CacheControl = "public, max-age=31536000, immutable" },
            DisablePayloadSigning = true,
        }, ct);
        return new StoredFile(key, $"{options.Value.PublicBaseUrl.TrimEnd('/')}/{key}");
    }

    public void Dispose() => _client.Dispose();
}
