using SkiaSharp;
using Storefront.Domain.Media;
using Storefront.Infrastructure.Media;

namespace Storefront.Web.IntegrationTests;

/// <summary>Photo shrinking and compression. No database needed.</summary>
public class ImageOptimizerTests
{
    private readonly SkiaImageOptimizer _optimizer = new();

    internal static byte[] Photo(int width, int height, SKEncodedImageFormat format = SKEncodedImageFormat.Jpeg, bool transparent = false)
    {
        using var bitmap = new SKBitmap(new SKImageInfo(width, height, SKColorType.Rgba8888, transparent ? SKAlphaType.Premul : SKAlphaType.Opaque));
        using (var canvas = new SKCanvas(bitmap))
        {
            canvas.Clear(transparent ? SKColors.Transparent : SKColors.White);
            // Noise-like detail, so the photo doesn't compress to almost nothing.
            var random = new Random(7);
            using var paint = new SKPaint();
            for (var i = 0; i < 400; i++)
            {
                paint.Color = new SKColor((byte)random.Next(256), (byte)random.Next(256), (byte)random.Next(256));
                canvas.DrawCircle(random.Next(width), random.Next(height), random.Next(4, Math.Max(5, width / 12)), paint);
            }
        }

        using var image = SKImage.FromBitmap(bitmap);
        return image.Encode(format, 95).ToArray();
    }

    [Fact]
    public void Large_photos_are_shrunk_to_the_max_side_and_compressed_to_webp()
    {
        var original = Photo(4000, 3000);
        var result = _optimizer.Optimize(original, MediaAsset.MaxSide, MediaAsset.MaxBytes);

        Assert.True(result.IsSuccess);
        var image = result.Value;
        Assert.Equal("image/webp", image.ContentType);
        Assert.Equal((1600, 1200), (image.Width, image.Height));
        Assert.True(image.Bytes.Length <= MediaAsset.MaxBytes);
        Assert.True(image.Bytes.Length < original.Length);
        Assert.Equal("image/webp", Storefront.Application.Media.ImageSignature.Detect(image.Bytes.AsSpan(0, 12)));
    }

    [Fact]
    public void Small_photos_keep_their_size_and_logos_keep_transparency()
    {
        var result = _optimizer.Optimize(Photo(400, 300, SKEncodedImageFormat.Png, transparent: true), MediaAsset.MaxSide, MediaAsset.MaxBytes);

        Assert.True(result.IsSuccess);
        Assert.Equal((400, 300), (result.Value.Width, result.Value.Height));
        using var decoded = SKBitmap.Decode(result.Value.Bytes);
        Assert.Contains(decoded.Pixels, p => p.Alpha == 0);
    }

    [Fact]
    public void Photos_that_cannot_be_read_are_refused()
    {
        var png = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 13, 1, 2, 3 };
        Assert.Equal("media.type", _optimizer.Optimize(png, MediaAsset.MaxSide, MediaAsset.MaxBytes).Error?.Code);
    }

    [Fact]
    public void Photos_with_too_many_pixels_are_refused_before_decoding()
    {
        // A tiny PNG whose header claims 10000 x 10000 pixels.
        var png = Photo(8, 8, SKEncodedImageFormat.Png);
        WriteBigEndian(png, 16, 10_000);
        WriteBigEndian(png, 20, 10_000);
        WriteBigEndian(png, 29, Crc32(png.AsSpan(12, 17)));

        Assert.Equal("media.dimensions", _optimizer.Optimize(png, MediaAsset.MaxSide, MediaAsset.MaxBytes).Error?.Code);
    }

    [Theory]
    [InlineData(SKEncodedOrigin.TopLeft, 30, 20)]
    [InlineData(SKEncodedOrigin.RightTop, 20, 30)]
    [InlineData(SKEncodedOrigin.LeftBottom, 20, 30)]
    [InlineData(SKEncodedOrigin.BottomRight, 30, 20)]
    public void Sideways_photos_are_turned_upright(SKEncodedOrigin origin, int width, int height)
    {
        // A 30 x 20 image with one red pixel at its top-left corner.
        using var source = new SKBitmap(new SKImageInfo(30, 20, SKColorType.Rgba8888, SKAlphaType.Opaque));
        source.Erase(SKColors.White);
        source.SetPixel(0, 0, SKColors.Red);

        using var upright = SkiaImageOptimizer.Orient(source, origin);

        Assert.Equal((width, height), (upright.Width, upright.Height));
        var (x, y) = origin switch
        {
            SKEncodedOrigin.RightTop => (width - 1, 0),
            SKEncodedOrigin.LeftBottom => (0, height - 1),
            SKEncodedOrigin.BottomRight => (width - 1, height - 1),
            _ => (0, 0),
        };
        Assert.Equal(SKColors.Red, upright.GetPixel(x, y));
    }

    private static void WriteBigEndian(byte[] bytes, int at, uint value)
    {
        bytes[at] = (byte)(value >> 24);
        bytes[at + 1] = (byte)(value >> 16);
        bytes[at + 2] = (byte)(value >> 8);
        bytes[at + 3] = (byte)value;
    }

    private static uint Crc32(ReadOnlySpan<byte> data)
    {
        var crc = 0xFFFFFFFFu;
        foreach (var b in data)
        {
            crc ^= b;
            for (var k = 0; k < 8; k++)
            {
                crc = (crc & 1) != 0 ? (crc >> 1) ^ 0xEDB88320u : crc >> 1;
            }
        }

        return ~crc;
    }
}
