namespace Storefront.Application.Tests;

public class AssemblyTests
{
    [Fact]
    public void Application_assembly_loads() => Assert.NotNull(typeof(AssemblyMarker).Assembly);
}
