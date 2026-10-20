using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Storefront.Application.Ai;
using Storefront.Application.Ai.Design;
using Storefront.Application.Ai.Menu;
using Storefront.Application.Ai.Text;
using Storefront.Domain.Media;
using Storefront.Web.Auth;

namespace Storefront.Web.Controllers.Api.V1;

/// <summary>
/// The AI helper. Nothing here saves: answers are suggestions the app shows for review. Each successful answer counts against
/// the business's monthly allowance (see status). When the helper is switched off every call answers 503 with code ai.unavailable;
/// out of answers is 429 ai.limit; a busy or failed model is 503 ai.busy or 502 ai.failed.
/// </summary>
[Route("api/v1/ai")]
[Authorize]
public sealed class AiController : ApiController
{
    private const long OnePhoto = MediaAsset.MaxUploadBytes + 64 * 1024;
    private const long ThreePhotos = ReadMenuHandler.MaxPhotos * MediaAsset.MaxUploadBytes + 64 * 1024;

    /// <summary>Whether the helper is switched on, and how many answers are left this month.</summary>
    [HttpGet("status")]
    public async Task<ActionResult<AiStatusDto>> Status([FromServices] GetAiStatusHandler handler, CancellationToken ct) =>
        From(await handler.Handle(ct));

    /// <summary>
    /// Colors and texts for the current template from one photo (form field "file": JPEG, PNG or WebP up to 5 MB) and an optional "note".
    /// Returns a settings patch to merge into the editor's draft.
    /// </summary>
    [HttpPost("design")]
    [EnableRateLimiting(RateLimits.Ai)]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(OnePhoto)]
    [RequestFormLimits(MultipartBodyLengthLimit = OnePhoto)]
    [ProducesResponseType<DesignSuggestionDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status502BadGateway)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<DesignSuggestionDto>> Design(IFormFile? file, [FromForm] string? note, [FromServices] SuggestDesignHandler handler, CancellationToken ct)
    {
        if (file is null)
        {
            return Problem(Storefront.Application.Common.Error.Validation("media.empty", "Choose a photo to upload.", "file"));
        }

        await using var stream = file.OpenReadStream();
        return From(await handler.Handle(new SuggestDesign(new AiPhoto(stream, file.Length), note), ct));
    }

    /// <summary>
    /// Categories and products read from 1 to 3 photos of a printed menu, price list or shelf (form field "files", each up to 5 MB)
    /// and an optional "note". Returns a draft to review; add the chosen items with POST /api/v1/catalog/import.
    /// </summary>
    [HttpPost("menu")]
    [EnableRateLimiting(RateLimits.Ai)]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(ThreePhotos)]
    [RequestFormLimits(MultipartBodyLengthLimit = ThreePhotos)]
    [ProducesResponseType<MenuDraftDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status502BadGateway)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<MenuDraftDto>> Menu(List<IFormFile>? files, [FromForm] string? note, [FromServices] ReadMenuHandler handler, CancellationToken ct)
    {
        var streams = (files ?? []).Select(f => (Stream: f.OpenReadStream(), f.Length)).ToList();
        try
        {
            return From(await handler.Handle(new ReadMenu(streams.Select(s => new AiPhoto(s.Stream, s.Length)).ToList(), note), ct));
        }
        finally
        {
            foreach (var (stream, _) in streams)
            {
                await stream.DisposeAsync();
            }
        }
    }

    /// <summary>
    /// Texts for the current template's text settings (and short descriptions for products without one), written for this business.
    /// "language" is en or ar (the site's language when empty).
    /// </summary>
    [HttpPost("text")]
    [EnableRateLimiting(RateLimits.Ai)]
    [ProducesResponseType<TextSuggestionDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status502BadGateway)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<TextSuggestionDto>> Text(WriteText request, [FromServices] WriteTextHandler handler, CancellationToken ct) =>
        From(await handler.Handle(request, ct));
}
