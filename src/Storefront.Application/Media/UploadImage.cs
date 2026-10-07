using Storefront.Application.Abstractions;
using Storefront.Application.Common;
using Storefront.Domain.Media;

namespace Storefront.Application.Media;

public sealed record MediaDto(Guid Id, string Url, string ContentType, long SizeBytes);

/// <summary>Stores a JPEG, PNG or WebP image up to 5 MB. The type is read from the file's first bytes, not trusted from the client.</summary>
public sealed class UploadImageHandler(IFileStorage storage, IMediaRepository media, ICurrentUser user, IUnitOfWork uow, IAuditLog audit, IClock clock)
{
    public async Task<Result<MediaDto>> Handle(Stream content, long length, CancellationToken ct)
    {
        if (user.BusinessId is not { } businessId)
        {
            return Error.Unauthorized("auth.required", "Log in to continue.");
        }

        if (length <= 0)
        {
            return Error.Validation("media.empty", "Choose a photo to upload.", "file");
        }

        if (length > MediaAsset.MaxBytes)
        {
            return Error.Validation("media.size", "Images can be up to 5 MB.", "file");
        }

        var header = new byte[12];
        var read = await content.ReadAtLeastAsync(header, header.Length, throwOnEndOfStream: false, ct);
        var contentType = ImageSignature.Detect(header.AsSpan(0, read));
        if (contentType is null)
        {
            return Error.Validation("media.type", "Upload a JPEG, PNG or WebP image.", "file");
        }

        var buffer = new MemoryStream();
        buffer.Write(header, 0, read);
        await content.CopyToAsync(buffer, ct);
        if (buffer.Length > MediaAsset.MaxBytes)
        {
            return Error.Validation("media.size", "Images can be up to 5 MB.", "file");
        }

        buffer.Position = 0;
        var id = Guid.CreateVersion7();
        var key = $"{businessId:N}/{id:N}{ImageSignature.Extension(contentType)}";
        var stored = await storage.SaveAsync(key, buffer, contentType, ct);

        var asset = MediaAsset.Create(businessId, stored.Url, contentType, buffer.Length, clock.UtcNow);
        media.Add(asset);
        audit.Record("upload", nameof(MediaAsset), asset.Id.ToString());
        await uow.SaveChangesAsync(ct);
        return new MediaDto(asset.Id, asset.Url, asset.ContentType, asset.SizeBytes);
    }
}

public static class ImageSignature
{
    public static string? Detect(ReadOnlySpan<byte> header)
    {
        if (header.Length >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF)
        {
            return "image/jpeg";
        }

        if (header.Length >= 8 && header[..8].SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }))
        {
            return "image/png";
        }

        if (header.Length >= 12 && header[..4].SequenceEqual("RIFF"u8) && header[8..12].SequenceEqual("WEBP"u8))
        {
            return "image/webp";
        }

        return null;
    }

    public static string Extension(string contentType) => contentType switch
    {
        "image/jpeg" => ".jpg",
        "image/png" => ".png",
        "image/webp" => ".webp",
        _ => "",
    };
}
