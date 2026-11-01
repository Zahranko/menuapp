using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Storefront.Application.Billing;
using Storefront.Application.Domains;

namespace Storefront.Web.Controllers.Api.V1;

[Route("api/v1")]
[Authorize]
public sealed class BillingController : ApiController
{
    [HttpGet("plans")]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<PlanDto>>> Plans([FromServices] ListPlansHandler handler, CancellationToken ct) =>
        Ok(await handler.Handle(ct));

    [HttpGet("subscription")]
    public async Task<ActionResult<SubscriptionDto>> Subscription([FromServices] GetSubscriptionHandler handler, CancellationToken ct) =>
        From(await handler.Handle(ct));

    /// <summary>Change plan. When <c>checkoutUrl</c> is set, open it; the plan changes once payment is done.</summary>
    [HttpPost("subscription/change")]
    [ProducesResponseType<ChangePlanResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ChangePlanResponse>> ChangePlan(ChangePlan request, [FromServices] ChangePlanHandler handler, CancellationToken ct) =>
        From(await handler.Handle(request, ct));

    /// <summary>The open custom domain request, or 204 when there is none.</summary>
    [HttpGet("domain-request")]
    [ProducesResponseType<DomainRequestDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<ActionResult<DomainRequestDto>> DomainRequest([FromServices] GetDomainRequestHandler handler, CancellationToken ct)
    {
        var result = await handler.Handle(ct);
        if (!result.IsSuccess)
        {
            return Problem(result.Error!);
        }

        return result.Value is { } request ? Ok(request) : NoContent();
    }

    /// <summary>Ask for your own domain (Pro plan). Support emails the DNS steps.</summary>
    [HttpPost("domain-request")]
    [ProducesResponseType<DomainRequestDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<DomainRequestDto?>> RequestDomain(RequestDomain request, [FromServices] RequestDomainHandler handler, CancellationToken ct) =>
        From(await handler.Handle(request, ct));

    [HttpDelete("domain-request")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<ActionResult> CancelDomainRequest([FromServices] CancelDomainRequestHandler handler, CancellationToken ct) =>
        From(await handler.Handle(ct));
}
