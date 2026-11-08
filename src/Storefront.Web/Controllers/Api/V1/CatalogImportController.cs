using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Storefront.Application.Catalog.Import;

namespace Storefront.Web.Controllers.Api.V1;

[Route("api/v1/catalog")]
[Authorize]
public sealed class CatalogImportController : ApiController
{
    /// <summary>
    /// Add many categories and products in one go (all or nothing), like the reviewed draft from a menu photo.
    /// Products join an existing category with the same name; other names become new categories. Up to 30 categories and 300 products.
    /// Field errors are keyed like "categories[0].products[2].price".
    /// </summary>
    [HttpPost("import")]
    [ProducesResponseType<ImportResultDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ImportResultDto>> Import(ImportCatalog request, [FromServices] ImportCatalogHandler handler, CancellationToken ct) =>
        From(await handler.Handle(request, ct));
}
