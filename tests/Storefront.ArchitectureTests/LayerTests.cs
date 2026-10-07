using System.Reflection;
using NetArchTest.Rules;

namespace Storefront.ArchitectureTests;

public class LayerTests
{
    private static readonly Assembly Domain = typeof(Storefront.Domain.AssemblyMarker).Assembly;
    private static readonly Assembly Application = typeof(Storefront.Application.AssemblyMarker).Assembly;
    private static readonly Assembly Infrastructure = typeof(Storefront.Infrastructure.AssemblyMarker).Assembly;

    private static readonly string[] AllowedDomainReferences = ["System.Runtime", "System.Private.CoreLib", "netstandard", "System.Collections", "System.Linq", "System.Text.RegularExpressions", "System.Memory"];

    [Fact]
    public void Domain_references_no_other_project_or_package()
    {
        var offenders = Domain.GetReferencedAssemblies()
            .Select(a => a.Name!)
            .Where(name => !name.StartsWith("System.", StringComparison.Ordinal) && !AllowedDomainReferences.Contains(name))
            .ToList();

        Assert.Empty(offenders);
    }

    [Fact]
    public void Application_does_not_reference_Infrastructure_or_Web()
    {
        var names = Application.GetReferencedAssemblies().Select(a => a.Name).ToList();
        Assert.DoesNotContain("Storefront.Infrastructure", names);
        Assert.DoesNotContain("Storefront.Web", names);

        var result = Types.InAssembly(Application)
            .ShouldNot().HaveDependencyOnAny("Storefront.Infrastructure", "Storefront.Web", "Microsoft.EntityFrameworkCore", "Microsoft.AspNetCore")
            .GetResult();
        Assert.True(result.IsSuccessful, Failing(result));
    }

    [Fact]
    public void Infrastructure_does_not_reference_Web()
    {
        Assert.DoesNotContain("Storefront.Web", Infrastructure.GetReferencedAssemblies().Select(a => a.Name));

        var result = Types.InAssembly(Infrastructure)
            .ShouldNot().HaveDependencyOn("Storefront.Web")
            .GetResult();
        Assert.True(result.IsSuccessful, Failing(result));
    }

    [Fact]
    public void Domain_types_do_not_depend_on_outer_layers()
    {
        var result = Types.InAssembly(Domain)
            .ShouldNot().HaveDependencyOnAny("Storefront.Application", "Storefront.Infrastructure", "Storefront.Web")
            .GetResult();
        Assert.True(result.IsSuccessful, Failing(result));
    }

    private static string Failing(TestResult result) =>
        "Offending types: " + string.Join(", ", result.FailingTypeNames ?? []);
}
