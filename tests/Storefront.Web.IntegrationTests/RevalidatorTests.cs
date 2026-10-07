using System.Net;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Storefront.Infrastructure.Revalidation;

namespace Storefront.Web.IntegrationTests;

public class RevalidatorTests
{
    private sealed class RecordingHandler : HttpMessageHandler
    {
        public HttpRequestMessage? Request { get; private set; }
        public string? Body { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            Request = request;
            Body = await request.Content!.ReadAsStringAsync(ct);
            return new HttpResponseMessage(HttpStatusCode.OK);
        }
    }

    [Fact]
    public async Task Posts_tags_with_an_hmac_signature_of_the_body()
    {
        var handler = new RecordingHandler();
        var options = Options.Create(new RevalidationOptions { Url = "https://sites.test/api/revalidate", Secret = "s3cret" });
        var revalidator = new HttpSiteRevalidator(new HttpClient(handler), options, NullLogger<HttpSiteRevalidator>.Instance);

        await revalidator.RevalidateAsync(["site:vanillamenu"], CancellationToken.None);

        Assert.Equal("""{"tags":["site:vanillamenu"]}""", handler.Body);
        var signature = Assert.Single(handler.Request!.Headers.GetValues(HttpSiteRevalidator.SignatureHeader));
        Assert.Equal(HttpSiteRevalidator.Sign(handler.Body!, "s3cret"), signature);
        Assert.Equal(64, signature.Length);
    }
}
