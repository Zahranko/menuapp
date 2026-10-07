using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Storefront.Application.Catalog;
using Storefront.Application.Catalog.Products;

namespace Storefront.Web.Controllers.Api.V1;

[Route("api/v1/products")]
[Authorize]
public sealed class ProductsController : ApiController
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProductDto>>> List([FromQuery] Guid? categoryId, [FromQuery] string? q, [FromServices] ListProductsHandler handler, CancellationToken ct) =>
        Ok(await handler.Handle(categoryId, q, ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProductDto>> Get(Guid id, [FromServices] GetProductHandler handler, CancellationToken ct) =>
        From(await handler.Handle(id, ct));

    [HttpPost]
    [ProducesResponseType<ProductDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProductDto>> Create(SaveProduct request, [FromServices] CreateProductHandler handler, CancellationToken ct)
    {
        var result = await handler.Handle(request, ct);
        return result.IsSuccess ? Created($"/api/v1/products/{result.Value.Id}", result.Value) : Problem(result.Error!);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType<ProductDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProductDto>> Update(Guid id, SaveProduct request, [FromServices] UpdateProductHandler handler, CancellationToken ct) =>
        From(await handler.Handle(id, request, ct));

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(Guid id, [FromServices] DeleteProductHandler handler, CancellationToken ct) =>
        From(await handler.Handle(id, ct));

    /// <summary>Sold out (false) or available (true).</summary>
    [HttpPatch("{id:guid}/availability")]
    public async Task<ActionResult<ProductDto>> SetAvailability(Guid id, SetAvailability request, [FromServices] SetAvailabilityHandler handler, CancellationToken ct) =>
        From(await handler.Handle(id, request, ct));

    /// <summary>All product ids of one category in the new order.</summary>
    [HttpPut("order")]
    public async Task<ActionResult<IReadOnlyList<ProductDto>>> Reorder(ReorderProducts request, [FromServices] ReorderProductsHandler handler, CancellationToken ct) =>
        From(await handler.Handle(request, ct));
}
