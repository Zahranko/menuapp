using Storefront.Domain.Common;

namespace Storefront.Domain.Media;

public sealed class MediaAsset : Entity, ITenantOwned
{
    /// <summary>The largest photo an owner can upload. The server then shrinks and compresses it.</summary>
    public const long MaxUploadBytes = 5 * 1024 * 1024;

    /// <summary>The largest stored photo, after compression.</summary>
    public const long MaxBytes = 1024 * 1024;

    /// <summary>Stored photos are at most this many pixels on their longest side.</summary>
    public const int MaxSide = 1600;

    /// <summary>Uploads with more pixels than this are refused before they are decoded.</summary>
    public const long MaxPixels = 40_000_000;
    public static readonly IReadOnlySet<string> ContentTypes = new HashSet<string> { "image/jpeg", "image/png", "image/webp" };

    private MediaAsset()
    {
    }

    public Guid BusinessId { get; private set; }
    public string Url { get; private set; } = "";
    public string ContentType { get; private set; } = "";
    public long SizeBytes { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }

    public static MediaAsset Create(Guid businessId, string url, string contentType, long sizeBytes, DateTimeOffset now)
    {
        if (!ContentTypes.Contains(contentType))
        {
            throw new DomainException("media.type", "Upload a JPEG, PNG or WebP image.", "file");
        }

        if (sizeBytes is <= 0 or > MaxBytes)
        {
            throw new DomainException("media.size", "Images can be up to 1 MB after compression.", "file");
        }

        return new MediaAsset { BusinessId = businessId, Url = url, ContentType = contentType, SizeBytes = sizeBytes, CreatedAt = now };
    }
}
