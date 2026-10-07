using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Storefront.Application.Catalog;
using Storefront.Application.Catalog.Categories;

namespace Storefront.Web.Controllers.Api.V1;

[Route("api/v1/categories")]
[Authorize]
public sealed class CategoriesController : ApiController
{
    /// <summary>Categories in display order, each with its number of products.</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CategoryDto>>> List([FromServices] ListCategoriesHandler handler, CancellationToken ct) =>
        Ok(await handler.Handle(ct));

    [HttpPost]
    [ProducesResponseType<CategoryDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CategoryDto>> Create(SaveCategory request, [FromServices] CreateCategoryHandler handler, CancellationToken ct)
    {
        var result = await handler.Handle(request, ct);
        return result.IsSuccess ? Created($"/api/v1/categories/{result.Value.Id}", result.Value) : Problem(result.Error!);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType<CategoryDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CategoryDto>> Rename(Guid id, SaveCategory request, [FromServices] RenameCategoryHandler handler, CancellationToken ct) =>
        From(await handler.Handle(id, request, ct));

    /// <summary>A category with products needs <c>moveTo</c> (another category) or <c>deleteProducts=true</c>.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Delete(Guid id, [FromQuery] Guid? moveTo, [FromQuery] bool deleteProducts, [FromServices] DeleteCategoryHandler handler, CancellationToken ct) =>
        From(await handler.Handle(new DeleteCategory(id, moveTo, deleteProducts), ct));

    /// <summary>The full list of category ids in the new order.</summary>
    [HttpPut("order")]
    [ProducesResponseType<IReadOnlyList<CategoryDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<CategoryDto>>> Reorder(IReadOnlyList<Guid> ids, [FromServices] ReorderCategoriesHandler handler, CancellationToken ct) =>
        From(await handler.Handle(new ReorderCategories(ids), ct));
}
