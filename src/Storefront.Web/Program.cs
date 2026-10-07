using Serilog;
using Serilog.Formatting.Compact;
using Storefront.Application;
using Storefront.Application.Common;
using Storefront.Infrastructure;
using Storefront.Web.Auth;
using Storefront.Web.Configuration;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddBrandFile(builder.Environment.ContentRootPath);

builder.Host.UseSerilog((context, logger) => logger
    .ReadFrom.Configuration(context.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console(new RenderedCompactJsonFormatter()));

builder.Services.Configure<BrandOptions>(builder.Configuration.GetSection(BrandOptions.SectionName));
builder.Services.AddProblemDetails();
builder.Services.AddOpenApi("v1");
builder.Services.AddHealthChecks();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<Storefront.Application.Abstractions.ICurrentUser, HttpCurrentUser>();
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddStorefrontAuth();
builder.Services.AddStorefrontRateLimits(builder.Configuration);
builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(o => o.InvalidModelStateResponseFactory = InvalidRequest.Respond);

var app = builder.Build();

await app.PrepareDatabaseAsync();

app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseSerilogRequestLogging();
app.UseLocalMedia();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapOpenApi("/openapi/{documentName}.json");
app.MapHealthChecks("/health");
app.MapControllers();

app.Run();

public partial class Program;
