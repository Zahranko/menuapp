using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Storefront.Application.Sites;
using Storefront.Application.Templates;

namespace Storefront.Web.Controllers.Api.V1;

[Route("api/v1")]
public sealed class SiteController : ApiController
{
    /// <summary>The template gallery. Also open without login.</summary>
    [HttpGet("templates")]
    [AllowAnonymous]
    [ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any)]
    public async Task<ActionResult<IReadOnlyList<TemplateDto>>> Templates([FromServices] ListTemplatesHandler handler, CancellationToken ct) =>
        Ok(await handler.Handle(ct));

    [HttpGet("site")]
    [Authorize]
    public async Task<ActionResult<SiteDto>> Get([FromServices] GetSiteHandler handler, CancellationToken ct) =>
        From(await handler.Handle(ct));

    /// <summary>Choose a template. The draft resets to its defaults; the live site changes when you publish.</summary>
    [HttpPut("site/template")]
    [Authorize]
    [ProducesResponseType<SiteDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<SiteDto>> ChangeTemplate(ChangeTemplate request, [FromServices] ChangeTemplateHandler handler, CancellationToken ct) =>
        From(await handler.Handle(request, ct));

    /// <summary>Save design settings (validated against the template's schema; missing keys get defaults).</summary>
    [HttpPut("site/draft")]
    [Authorize]
    [ProducesResponseType<SiteDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<SiteDto>> SaveDraft(SaveDraft request, [FromServices] SaveDraftHandler handler, CancellationToken ct) =>
        From(await handler.Handle(request, ct));

    [HttpPost("site/publish")]
    [Authorize]
    public async Task<ActionResult<SiteDto>> Publish([FromServices] PublishSiteHandler handler, CancellationToken ct) =>
        From(await handler.Handle(ct));

    /// <summary>A link that shows the draft for 30 minutes.</summary>
    [HttpPost("site/preview-token")]
    [Authorize]
    public ActionResult<PreviewLink> PreviewToken([FromServices] CreatePreviewTokenHandler handler) =>
        From(handler.Handle());
}
