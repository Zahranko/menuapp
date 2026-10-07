namespace Storefront.Domain.Tests;

public class AssemblyTests
{
    [Fact]
    public void Domain_assembly_loads() => Assert.NotNull(typeof(AssemblyMarker).Assembly);
}
