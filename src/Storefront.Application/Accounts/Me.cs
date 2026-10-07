using Microsoft.Extensions.Options;
using Storefront.Application.Abstractions;
using Storefront.Application.Common;

namespace Storefront.Application.Accounts;

public sealed class GetMeHandler(ICurrentUser currentUser, IIdentityService identity, IBusinessRepository businesses, IOptions<BrandOptions> brand)
{
    public async Task<Result<MeResponse>> Handle(CancellationToken ct)
    {
        if (currentUser.UserId is not { } userId || currentUser.BusinessId is not { } businessId)
        {
            return Error.Unauthorized("auth.required", "Log in to continue.");
        }

        var user = await identity.FindByIdAsync(userId, ct);
        var business = await businesses.GetAsync(businessId, ct);
        if (user is null || business is null || business.OwnerUserId != userId)
        {
            return Error.Unauthorized("auth.required", "Log in to continue.");
        }

        return new MeResponse(user.Id, user.Email, user.Phone, BusinessDto.From(business, brand.Value.Domain));
    }
}
