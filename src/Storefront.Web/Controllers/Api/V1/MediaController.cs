using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Storefront.Application.Media;
using Storefront.Domain.Media;

namespace Storefront.Web.Controllers.Api.V1;

[Route("api/v1/media")]
[Authorize]
public sealed class MediaController : ApiController
{
    /// <summary>Upload one image (form field "file"): JPEG, PNG or WebP, up to 5 MB. It is stored shrunk to 1600 px and compressed to WebP.</summary>
    [HttpPost]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MediaAsset.MaxUploadBytes + 64 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = MediaAsset.MaxUploadBytes + 64 * 1024)]
    [ProducesResponseType<MediaDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<MediaDto>> Upload(IFormFile? file, [FromServices] UploadImageHandler handler, CancellationToken ct)
    {
        if (file is null)
        {
            return Problem(Storefront.Application.Common.Error.Validation("media.empty", "Choose a photo to upload.", "file"));
        }

        await using var stream = file.OpenReadStream();
        var result = await handler.Handle(stream, file.Length, ct);
        return result.IsSuccess ? Created(result.Value.Url, result.Value) : Problem(result.Error!);
    }
}
