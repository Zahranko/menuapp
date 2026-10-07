using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace Storefront.Application;

public static class DependencyInjection
{
    /// <summary>Registers every handler (class name ending in "Handler") and helper use case, plus all validators.</summary>
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = typeof(DependencyInjection).Assembly;
        foreach (var type in assembly.GetTypes().Where(t => t is { IsClass: true, IsAbstract: false, IsPublic: true }
                     && (t.Name.EndsWith("Handler", StringComparison.Ordinal) || t.Name.EndsWith("Issuer", StringComparison.Ordinal) || t.Name.EndsWith("Checker", StringComparison.Ordinal) || t.Name == "SiteContext")))
        {
            services.AddScoped(type);
        }

        services.AddValidatorsFromAssembly(assembly, ServiceLifetime.Singleton, includeInternalTypes: false);
        return services;
    }
}
