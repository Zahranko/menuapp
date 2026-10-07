using System.Security.Claims;
using Storefront.Application.Abstractions;

namespace Storefront.Web.Auth;

/// <summary>Reads the signed-in user from the request: "sub" is the user id, "biz" the business id.</summary>
internal sealed class HttpCurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    public const string BusinessClaim = "biz";
    public const string StaffRole = "Staff";

    private ClaimsPrincipal? User => accessor.HttpContext?.User;

    public Guid? UserId => Read(ClaimTypes.NameIdentifier) ?? Read("sub");

    public Guid? BusinessId => Read(BusinessClaim);

    public bool IsStaff => User?.IsInRole(StaffRole) ?? false;

    private Guid? Read(string type) => Guid.TryParse(User?.FindFirstValue(type), out var id) ? id : null;
}
