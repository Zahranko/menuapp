using SkiaSharp;
using Storefront.Application.Abstractions;
using Storefront.Application.Common;
using Storefront.Domain.Media;

namespace Storefront.Infrastructure.Media;

/// <summary>
/// Shrinks and compresses uploaded photos with SkiaSharp (MIT licensed): turns them upright from the camera's
/// orientation flag, scales them down to fit <c>maxSide</c>, and saves them as WebP, which keeps transparency for logos.
/// Re-encoding also drops EXIF metadata such as the photo's location.
/// </summary>
internal sealed class SkiaImageOptimizer : IImageOptimizer
{
    private static readonly int[] Qualities = [80, 70, 60];

    public Result<OptimizedImage> Optimize(ReadOnlyMemory<byte> image, int maxSide, long maxBytes)
    {
        using var data = SKData.CreateCopy(image.Span);
        using var codec = SKCodec.Create(data);
        if (codec is null)
        {
            return Unreadable();
        }

        var info = codec.Info;
        if (info.Width <= 0 || info.Height <= 0)
        {
            return Unreadable();
        }

        // Checked before decoding, so a small file that claims huge dimensions can't exhaust memory.
        if ((long)info.Width * info.Height > MediaAsset.MaxPixels)
        {
            return Error.Validation("media.dimensions", "This photo has too many pixels. Use one under 40 megapixels.", "file");
        }

        var alpha = info.AlphaType == SKAlphaType.Opaque ? SKAlphaType.Opaque : SKAlphaType.Premul;
        using var decoded = SKBitmap.Decode(codec, new SKImageInfo(info.Width, info.Height, SKColorType.Rgba8888, alpha));
        if (decoded is null)
        {
            return Unreadable();
        }

        using var upright = Orient(decoded, codec.EncodedOrigin);
        var side = maxSide;
        while (true)
        {
            using var sized = Fit(upright, side);
            using var frame = SKImage.FromBitmap(sized ?? upright);
            foreach (var quality in Qualities)
            {
                using var encoded = frame.Encode(SKEncodedImageFormat.Webp, quality);
                if (encoded is null)
                {
                    return Unreadable();
                }

                if (encoded.Size <= maxBytes)
                {
                    return new OptimizedImage(encoded.ToArray(), "image/webp", frame.Width, frame.Height);
                }
            }

            // Still too heavy at the lowest quality (rare: very detailed photos): try a smaller size.
            side = (int)(Math.Max(frame.Width, frame.Height) * 0.8);
            if (side < 320)
            {
                return Error.Validation("media.size", "This photo is too detailed to compress. Try another one.", "file");
            }
        }
    }

    private static Error Unreadable() => Error.Validation("media.type", "We couldn't read that photo. Upload a JPEG, PNG or WebP image.", "file");

    /// <summary>A copy scaled down to fit within <paramref name="maxSide"/>, or null when it already fits.</summary>
    private static SKBitmap? Fit(SKBitmap source, int maxSide)
    {
        var longest = Math.Max(source.Width, source.Height);
        if (longest <= maxSide)
        {
            return null;
        }

        var scale = (double)maxSide / longest;
        var target = new SKImageInfo(
            Math.Max(1, (int)Math.Round(source.Width * scale)), Math.Max(1, (int)Math.Round(source.Height * scale)), source.ColorType, source.AlphaType);
        return source.Resize(target, new SKSamplingOptions(SKCubicResampler.Mitchell));
    }

    /// <summary>Applies the EXIF orientation, so photos taken sideways show the right way up once the metadata is gone.</summary>
    internal static SKBitmap Orient(SKBitmap source, SKEncodedOrigin origin)
    {
        if (origin == SKEncodedOrigin.TopLeft)
        {
            return source.Copy();
        }

        var swap = origin is SKEncodedOrigin.LeftTop or SKEncodedOrigin.RightTop or SKEncodedOrigin.RightBottom or SKEncodedOrigin.LeftBottom;
        var width = swap ? source.Height : source.Width;
        var height = swap ? source.Width : source.Height;
        var result = new SKBitmap(new SKImageInfo(width, height, source.ColorType, source.AlphaType));
        using var canvas = new SKCanvas(result);
        canvas.Clear(SKColors.Transparent);
        switch (origin)
        {
            case SKEncodedOrigin.TopRight:
                canvas.Translate(width, 0);
                canvas.Scale(-1, 1);
                break;
            case SKEncodedOrigin.BottomRight:
                canvas.Translate(width, height);
                canvas.RotateDegrees(180);
                break;
            case SKEncodedOrigin.BottomLeft:
                canvas.Translate(0, height);
                canvas.Scale(1, -1);
                break;
            case SKEncodedOrigin.LeftTop:
                canvas.RotateDegrees(90);
                canvas.Scale(1, -1);
                break;
            case SKEncodedOrigin.RightTop:
                canvas.Translate(width, 0);
                canvas.RotateDegrees(90);
                break;
            case SKEncodedOrigin.RightBottom:
                canvas.Translate(width, height);
                canvas.RotateDegrees(90);
                canvas.Scale(-1, 1);
                break;
            case SKEncodedOrigin.LeftBottom:
                canvas.Translate(0, height);
                canvas.RotateDegrees(270);
                break;
        }

        canvas.DrawBitmap(source, 0, 0);
        return result;
    }
}
