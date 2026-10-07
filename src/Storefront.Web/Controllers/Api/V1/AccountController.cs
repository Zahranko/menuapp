using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Storefront.Application.Accounts;
using Storefront.Application.Businesses;

namespace Storefront.Web.Controllers.Api.V1;

[Route("api/v1")]
[Authorize]
public sealed class AccountController : ApiController
{
    [HttpGet("me")]
    public async Task<ActionResult<MeResponse>> Me([FromServices] GetMeHandler handler, CancellationToken ct) =>
        From(await handler.Handle(ct));

    [HttpGet("business")]
    public async Task<ActionResult<BusinessDto>> GetBusiness([FromServices] GetBusinessHandler handler, CancellationToken ct) =>
        From(await handler.Handle(ct));

    /// <summary>Updates business info. The site address (slug) does not change when the name changes.</summary>
    [HttpPut("business")]
    [ProducesResponseType<BusinessDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BusinessDto>> UpdateBusiness(UpdateBusiness request, [FromServices] UpdateBusinessHandler handler, CancellationToken ct) =>
        From(await handler.Handle(request, ct));
}
