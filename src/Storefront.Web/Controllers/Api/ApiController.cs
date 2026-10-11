using Microsoft.AspNetCore.Mvc;
using Storefront.Application.Common;
using Storefront.Web.Configuration;

namespace Storefront.Web.Controllers.Api;

[ApiController]
[Produces("application/json")]
public abstract class ApiController : ControllerBase
{
    /// <summary>
    /// Maps an expected failure to RFC 7807 ProblemDetails with "code" and a field-keyed "errors" dictionary,
    /// with messages in the request's language (Accept-Language).
    /// </summary>
    protected ActionResult Problem(Error error)
    {
        var status = error.Type switch
        {
            ErrorType.Validation => StatusCodes.Status400BadRequest,
            ErrorType.NotFound => StatusCodes.Status404NotFound,
            ErrorType.Conflict => StatusCodes.Status409Conflict,
            ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
            ErrorType.Forbidden => StatusCodes.Status403Forbidden,
            _ => StatusCodes.Status400BadRequest,
        };

        var problem = new ValidationProblemDetails(error.Fields?.ToDictionary(f => f.Key, f => f.Value) ?? [])
        {
            Status = status,
            Title = error.Message,
            Type = $"https://httpstatuses.io/{status}",
        };
        problem.Extensions["code"] = error.Code;
        ApiLocalization.Localize(problem, error.Code);
        return new ObjectResult(problem) { StatusCode = status, ContentTypes = { "application/problem+json" } };
    }

    protected ActionResult<T> From<T>(Result<T> result) => result.IsSuccess ? Ok(result.Value) : Problem(result.Error!);

    protected ActionResult From(Result result) => result.IsSuccess ? NoContent() : Problem(result.Error!);
}
