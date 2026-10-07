using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using Storefront.Infrastructure.Storage;

namespace Storefront.Web.Configuration;

public static class LocalMedia
{
    /// <summary>Serves uploads at /media when files are stored on local disk (development).</summary>
    public static WebApplication UseLocalMedia(this WebApplication app)
    {
        var options = app.Services.GetRequiredService<IOptions<StorageOptions>>().Value;
        if (!string.Equals(options.Provider, "local", StringComparison.OrdinalIgnoreCase))
        {
            return app;
        }

        var root = Path.GetFullPath(options.LocalRoot);
        Directory.CreateDirectory(root);
        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = new PhysicalFileProvider(root),
            RequestPath = "/media",
            ServeUnknownFileTypes = false,
        });
        return app;
    }
}
