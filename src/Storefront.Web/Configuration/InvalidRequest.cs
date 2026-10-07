using Microsoft.AspNetCore.Mvc;

namespace Storefront.Web.Configuration;

/// <summary>Malformed JSON or wrong types: the same ProblemDetails shape as validation errors, with code "request.invalid".</summary>
public static class InvalidRequest
{
    public static IActionResult Respond(ActionContext context)
    {
        var problem = new ValidationProblemDetails(context.ModelState)
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "The request could not be read.",
            Type = "https://httpstatuses.io/400",
        };
        problem.Extensions["code"] = "request.invalid";
        return new BadRequestObjectResult(problem) { ContentTypes = { "application/problem+json" } };
    }
}
