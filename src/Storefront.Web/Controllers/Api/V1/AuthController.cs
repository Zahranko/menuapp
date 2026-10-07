using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Storefront.Application.Accounts;
using Storefront.Web.Auth;

namespace Storefront.Web.Controllers.Api.V1;

[Route("api/v1/auth")]
[EnableRateLimiting(RateLimits.Auth)]
public sealed class AuthController : ApiController
{
    /// <summary>Creates the owner's account, business, site (template Souq) and a Basic trial.</summary>
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AuthResponse>> Register(Register request, [FromServices] RegisterHandler handler, CancellationToken ct) =>
        From(await handler.Handle(request, ct));

    [HttpGet("slug-availability")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimits.SlugCheck)]
    public async Task<ActionResult<SlugAvailabilityResponse>> SlugAvailability([FromQuery] string? name, [FromServices] SlugAvailabilityHandler handler, CancellationToken ct) =>
        Ok(await handler.Handle(name, ct));

    /// <summary>Log in with an email or a phone number (with country code) and a password.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponse>> Login(LogIn request, [FromServices] LoginHandler handler, CancellationToken ct) =>
        From(await handler.Handle(request, ct));

    /// <summary>Swaps a refresh token for a new pair. Reusing an old refresh token ends that device's sessions.</summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponse>> Refresh(RefreshSession request, [FromServices] RefreshHandler handler, CancellationToken ct) =>
        From(await handler.Handle(request, ct));

    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout(Logout request, [FromServices] LogoutHandler handler, CancellationToken ct)
    {
        await handler.Handle(request, ct);
        return NoContent();
    }

    /// <summary>Always 202, whether or not the email has an account.</summary>
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    public async Task<IActionResult> ForgotPassword(ForgotPassword request, [FromServices] ForgotPasswordHandler handler, CancellationToken ct)
    {
        await handler.Handle(request, ct);
        return Accepted();
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword(ResetPassword request, [FromServices] ResetPasswordHandler handler, CancellationToken ct) =>
        From(await handler.Handle(request, ct));
}
