using Serilog;
using Serilog.Formatting.Compact;
using Storefront.Application.Common;
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

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseSerilogRequestLogging();

app.MapOpenApi("/openapi/{documentName}.json");
app.MapHealthChecks("/health");

app.Run();

public partial class Program;
