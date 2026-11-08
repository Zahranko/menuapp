using System.Globalization;
using Microsoft.AspNetCore.Localization;
using Microsoft.AspNetCore.Mvc;
using Storefront.Application.Common.Localization;

namespace Storefront.Web.Configuration;

/// <summary>
/// The response language comes from Accept-Language: "ar" (or "ar-JO" and friends) gets Arabic messages, anything else English.
/// Only the UI culture changes; number and date formatting stay invariant English so prices and JSON never change shape.
/// Messages are raised in English everywhere and translated here, where they become ProblemDetails. Codes never change.
/// </summary>
public static class ApiLocalization
{
    public static IServiceCollection AddStorefrontLocalization(this IServiceCollection services)
    {
        services.Configure<RequestLocalizationOptions>(o =>
        {
            var english = new CultureInfo(Messages.English);
            o.DefaultRequestCulture = new RequestCulture(english);
            o.SupportedCultures = [english];
            o.SupportedUICultures = [english, new CultureInfo(Messages.Arabic)];
            o.FallBackToParentUICultures = true;
            o.RequestCultureProviders = [new AcceptLanguageHeaderRequestCultureProvider()];
            o.ApplyCurrentCultureToResponseHeaders = true;
        });
        return services;
    }

    /// <summary>The language of this response: "ar" or "en".</summary>
    public static string Locale => Messages.IsArabic(CultureInfo.CurrentUICulture.Name) ? Messages.Arabic : Messages.English;

    /// <summary>One message in the response language. <paramref name="code"/> is the fallback key when the wording is not in the catalog.</summary>
    public static string Text(string english, string? code = null) => Messages.Translate(english, code, Locale);

    /// <summary>
    /// Translates the title, detail and every field message. A field message that repeats the title is the error's own
    /// message, so it may fall back to the code; other field messages are matched by their wording.
    /// <paramref name="unknownFieldMessage"/> replaces field messages the catalog does not know (framework model-binding text).
    /// </summary>
    public static void Localize(ProblemDetails problem, string? code, string? unknownFieldMessage = null)
    {
        if (Locale != Messages.Arabic)
        {
            return;
        }

        var title = problem.Title;
        if (title is not null)
        {
            problem.Title = Text(title, code);
        }

        if (problem.Detail is { } detail)
        {
            problem.Detail = Messages.TryArabicText(detail) ?? detail;
        }

        if (problem is ValidationProblemDetails validation)
        {
            foreach (var key in validation.Errors.Keys.ToList())
            {
                validation.Errors[key] = validation.Errors[key]
                    .Select(m => m == title
                        ? Text(m, code)
                        : Messages.TryArabicText(m) ?? (unknownFieldMessage is null ? m : Text(unknownFieldMessage)))
                    .ToArray();
            }
        }
    }

    /// <summary>
    /// For ProblemDetails the framework writes itself (status code pages, auth challenges, unhandled errors).
    /// Matches wording only: a body that is already Arabic stays as it is.
    /// </summary>
    public static void LocalizeFrameworkProblem(ProblemDetails problem)
    {
        if (Locale != Messages.Arabic)
        {
            return;
        }

        if (problem.Title is { } title)
        {
            problem.Title = Messages.TryArabicText(title) ?? title;
        }

        if (problem.Detail is { } detail)
        {
            problem.Detail = Messages.TryArabicText(detail) ?? detail;
        }
    }
}
