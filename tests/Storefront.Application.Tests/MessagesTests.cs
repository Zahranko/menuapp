using System.Reflection;
using System.Text.RegularExpressions;
using Storefront.Application.Accounts;
using Storefront.Application.Common;
using Storefront.Application.Common.Localization;

namespace Storefront.Application.Tests;

public class MessagesTests
{
    [Theory]
    [InlineData("ar")]
    [InlineData("ar-JO")]
    [InlineData("AR")]
    public void Arabic_locales_get_Arabic(string locale) =>
        Assert.Equal("سجّل الدخول للمتابعة.", Messages.Translate("Log in to continue.", "auth.required", locale));

    [Theory]
    [InlineData("en")]
    [InlineData("en-US")]
    [InlineData("fr")]
    [InlineData(null)]
    public void Other_locales_stay_English(string? locale) =>
        Assert.Equal("Log in to continue.", Messages.Translate("Log in to continue.", "auth.required", locale));

    [Fact]
    public void Placeholders_carry_their_values()
    {
        Assert.Equal("أضف حتى 6 صور.", Messages.Translate("Add up to 6 photos.", "validation", "ar"));
        Assert.Equal("هذا الرابط محجوز. جرّب إضافة اسم منطقتك، مثل vanillamenudowntown.",
            Messages.Translate("That link is taken. Try adding your area, like vanillamenudowntown.", "slug.unavailable", "ar"));
        Assert.Equal("اختر قيمة من 0 إلى 90.", Messages.Translate("Choose a value from 0 to 90.", null, "ar"));
    }

    [Fact]
    public void Unknown_wording_falls_back_to_the_code_then_to_English()
    {
        Assert.Equal("لم نعثر على المنتج.", Messages.Translate("This product is gone.", "product.notFound", "ar"));
        Assert.Equal("Something new.", Messages.Translate("Something new.", "no.such.code", "ar"));
    }

    [Fact]
    public void Text_wins_over_the_code_when_one_code_has_several_wordings()
    {
        Assert.Equal("يمكن أن يصل حجم الصورة إلى 5 ميغابايت.", Messages.Translate("Images can be up to 5 MB.", "media.size", "ar"));
        Assert.Equal("تفاصيل هذه الصورة كثيرة ولا يمكن ضغطها. جرّب صورة أخرى.",
            Messages.Translate("This photo is too detailed to compress. Try another one.", "media.size", "ar"));
    }

    [Fact]
    public void Reset_email_follows_the_business_language()
    {
        var arabic = ForgotPasswordHandler.Compose("a@b.co", "https://x.test/r", "BrandX", "ar");
        Assert.Contains("BrandX", arabic.Subject);
        Assert.Contains("إعادة تعيين كلمة المرور", arabic.Subject);
        Assert.Contains("dir=\"rtl\"", arabic.Html);

        var english = ForgotPasswordHandler.Compose("a@b.co", "https://x.test/r", "BrandX", "en");
        Assert.Equal("Reset your BrandX password", english.Subject);
    }
}

/// <summary>New errors and messages cannot ship without Arabic.</summary>
public partial class MessagesCoverageTests
{
    private static readonly string Src = Path.Combine(RepoRoot(), "src");

    private static string RepoRoot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null && !File.Exists(Path.Combine(dir.FullName, "Storefront.sln")))
        {
            dir = dir.Parent;
        }

        return dir?.FullName ?? throw new InvalidOperationException("Storefront.sln not found above the test output.");
    }

    private static IEnumerable<(string File, string Text)> SourceFiles() =>
        Directory.EnumerateFiles(Src, "*.cs", SearchOption.AllDirectories)
            .Where(f => !f.Contains($"{Path.DirectorySeparatorChar}obj{Path.DirectorySeparatorChar}") &&
                        !f.Contains($"{Path.DirectorySeparatorChar}bin{Path.DirectorySeparatorChar}") &&
                        !f.Contains($"{Path.DirectorySeparatorChar}Migrations{Path.DirectorySeparatorChar}") &&
                        !f.EndsWith("Messages.cs", StringComparison.Ordinal))
            .Select(f => (Path.GetRelativePath(Src, f), File.ReadAllText(f)));

    [Fact]
    public void Every_static_error_has_Arabic_for_its_code_and_its_wording()
    {
        var errors = typeof(AssemblyMarker).Assembly.GetTypes()
            .SelectMany(t => t.GetFields(BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic))
            .Where(f => f.FieldType == typeof(Error))
            .Select(f => (Field: $"{f.DeclaringType!.Name}.{f.Name}", Error: (Error)f.GetValue(null)!))
            .ToList();

        Assert.NotEmpty(errors);
        var missing = errors
            .Where(e => !Messages.HasCode(e.Error.Code) || Messages.TryArabicText(e.Error.Message) is null)
            .Select(e => $"{e.Field} ({e.Error.Code}: {e.Error.Message})")
            .ToList();
        Assert.True(missing.Count == 0, "No Arabic for: " + string.Join("; ", missing));
    }

    [Fact]
    public void Every_domain_message_constant_has_Arabic()
    {
        var constants = typeof(Domain.AssemblyMarker).Assembly.GetTypes()
            .SelectMany(t => t.GetFields(BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic))
            .Where(f => f.IsLiteral && f.FieldType == typeof(string) && f.Name.EndsWith("Message", StringComparison.Ordinal))
            .Select(f => (string)f.GetRawConstantValue()!)
            .ToList();

        Assert.NotEmpty(constants);
        Assert.All(constants, c => Assert.True(Messages.TryArabicText(c) is not null, $"No Arabic for \"{c}\""));
    }

    /// <summary>Every error code written anywhere in src/ (errors, domain rules, guards, ProblemDetails codes).</summary>
    [Fact]
    public void Every_error_code_in_the_source_has_Arabic()
    {
        var codes = SourceFiles()
            .SelectMany(f => CodePatterns().SelectMany(p => p.Matches(f.Text)).Select(m => (f.File, Code: m.Groups["code"].Value)))
            .ToList();

        Assert.Contains(codes, c => c.Code == "auth.invalid");
        Assert.Contains(codes, c => c.Code == "media.dimensions");
        Assert.Contains(codes, c => c.Code == "business.timezone");
        var missing = codes.Where(c => !Messages.HasCode(c.Code)).Select(c => $"{c.Code} ({c.File})").Distinct().ToList();
        Assert.True(missing.Count == 0, "No Arabic for codes: " + string.Join(", ", missing));
    }

    /// <summary>
    /// Every plain sentence literal in src/ (an English message shown to owners) has Arabic. Exception texts, logs and
    /// doc comments are not shown to owners and are skipped. Interpolated messages are covered by <see cref="Interpolated_messages_have_Arabic"/>.
    /// </summary>
    [Fact]
    public void Every_message_literal_in_the_source_has_Arabic()
    {
        var sentences = SourceFiles()
            .SelectMany(f => f.Text.Split('\n').Select(line => (f.File, Line: line)))
            .Where(l => !IsNotShownToOwners(l.Line))
            .SelectMany(l => Sentence().Matches(l.Line).Select(m => (l.File, Text: m.Groups["text"].Value)))
            .ToList();

        Assert.Contains(sentences, s => s.Text == "Enter your business name.");
        Assert.Contains(sentences, s => s.Text == "This template has no such setting.");
        Assert.Contains(sentences, s => s.Text == "An account with this email already exists. Log in instead.");
        var missing = sentences.Where(s => Messages.TryArabicText(s.Text) is null).Select(s => $"\"{s.Text}\" ({s.File})").Distinct().ToList();
        Assert.True(missing.Count == 0, "No Arabic for: " + string.Join("; ", missing));
    }

    [Theory]
    [InlineData("Password needs at least 8 characters.")]
    [InlineData("That link is taken. Try adding your area, like cafedowntown.")]
    [InlineData("Choose where its 1 product go first.")]
    [InlineData("Choose where its 4 products go first.")]
    [InlineData("Choose a label: Signature, New, Best seller, Vegan, Spicy, Custom.")]
    [InlineData("Label must be one of: Signature, New, Best seller, Vegan, Spicy, Custom.")]
    [InlineData("A request that is active cannot become requested.")]
    [InlineData("name must be 1 to 60 characters.")]
    [InlineData("address can be at most 200 characters.")]
    [InlineData("Choose one of: modern, elegant.")]
    [InlineData("Choose from: story, gallery.")]
    [InlineData("Use up to 40 characters.")]
    [InlineData("Choose a value from 0 to 90.")]
    [InlineData("Use steps of 5.")]
    [InlineData("Add up to 6 photos.")]
    [InlineData("Unknown day \"someday\".")]
    [InlineData("Unknown setting type \"video\".")]
    public void Interpolated_messages_have_Arabic(string english) =>
        Assert.NotNull(Messages.TryArabicText(english));

    /// <summary>Each interpolated message in src/ must be listed in <see cref="Interpolated_messages_have_Arabic"/>; this counts them so a new one fails here.</summary>
    [Fact]
    public void No_new_interpolated_message_without_a_sample()
    {
        var interpolated = SourceFiles()
            .SelectMany(f => f.Text.Split('\n'))
            .Where(l => !IsNotShownToOwners(l))
            .SelectMany(l => InterpolatedSentence().Matches(l).Select(m => m.Value))
            .Distinct()
            .Order()
            .ToList();

        string[] known =
        [
            "$\"Password needs at least {length} characters.\"",
            "$\"That link is taken. Try adding your area, like {Fit(slug, \"downtown\")}.\"",
            "$\"Choose where its {products.Count} product{(products.Count == 1 ? \"\" : \"s\")} go first.\"",
            "$\"Choose a label: {string.Join(\", \", ProductLabel.All)}.\"",
            "$\"Label must be one of: {string.Join(\", \", ProductLabel.All)}.\"",
            "$\"A request that is {Status} cannot become {next}.\"",
            "$\"{field} must be {min} to {max} characters.\"",
            "$\"{field} can be at most {max} characters.\"",
            "$\"Choose one of: {string.Join(\", \", field.Options!)}.\"",
            "$\"Choose from: {string.Join(\", \", field.Options!)}.\"",
            "$\"Use up to {max} characters.\"",
            "$\"Choose a value from {field.Min} to {field.RangeMax}.\"",
            "$\"Use steps of {step.ToString(CultureInfo.InvariantCulture)}.\"",
            "$\"Add up to {maxImages} photos.\"",
            "$\"Unknown day \\\"{day}\\\".\"",
            "$\"Unknown setting type \\\"{field.Type}\\\".\"",
        ];
        // Email bodies are written in both languages where they are composed, not translated through the catalog.
        string[] emails =
        [
            "$\"{businessName} asked to use {domain}. Send the DNS steps from the back office.\"",
            "$\"Thanks! Our team will email you the DNS steps for {domain} soon.\"",
        ];
        var unknown = interpolated.Where(i => !known.Contains(i) && !emails.Contains(i) && i.All(char.IsAscii)).ToList();
        Assert.True(unknown.Count == 0, "Add Arabic (a pattern in Messages) and a sample for: " + string.Join("; ", unknown));
    }

    private static bool IsNotShownToOwners(string line)
    {
        var t = line.TrimStart();
        return t.StartsWith("//", StringComparison.Ordinal) ||
               t.Contains("Exception(", StringComparison.Ordinal) ||
               t.Contains("logger.", StringComparison.Ordinal) ||
               t.Contains("Log(", StringComparison.Ordinal) ||
               t.Contains("[Description(", StringComparison.Ordinal);
    }

    private static Regex[] CodePatterns() =>
    [
        new(@"Error\.(?:Validation|NotFound|Conflict|Unauthorized|Forbidden)\(\s*""(?<code>[^""]+)"""),
        new(@"new Error\(\s*""(?<code>[^""]+)"""),
        new(@"new DomainException\(\s*""(?<code>[^""]+)"""),
        new(@"Guard\.(?:Optional)?Text\([^;]*,\s*""(?<code>[a-z]+\.[A-Za-z]+)""\)"),
        new(@"public const string \w+ = ""(?<code>[a-z]+\.[a-z][A-Za-z]+)"";"),
        new(@"\[""code""\]\s*=\s*""(?<code>[^""]+)"""),
        new(@"ApiLocalization\.(?:Text|Localize)\([^;]*?""(?<code>[a-z]+\.[a-z][A-Za-z]+)"""),
    ];

    /// <summary>A plain (not interpolated, not verbatim) string literal that reads like a sentence: capital first, a space, ending in . ? or !</summary>
    [GeneratedRegex(@"(?<![$@\w""])""(?<text>[A-Z][^""{}]* [^""{}]*[.?!])""")]
    private static partial Regex Sentence();

    [GeneratedRegex(@"\$""(?:[^""\\]|\\.|""[^""]*""(?=[^{}]*\}))*?[.?!]""")]
    private static partial Regex InterpolatedSentence();
}
