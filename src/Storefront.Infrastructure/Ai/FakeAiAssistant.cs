using System.Collections.Concurrent;
using System.Text.Json.Nodes;
using Storefront.Application.Ai;
using Storefront.Application.Common;

namespace Storefront.Infrastructure.Ai;

/// <summary>
/// A stand-in model for tests: fixed answers per task, with a few values that must be dropped (an unknown setting,
/// an option the template doesn't have, markup, a negative price), and every request recorded.
/// Set <see cref="Answer"/> to answer differently.
/// </summary>
internal sealed class FakeAiAssistant : IAiAssistant
{
    public ConcurrentQueue<AiRequest> Requests { get; } = new();

    public Func<AiRequest, Result<JsonNode>>? Answer { get; set; }

    public bool IsAvailable => true;

    public Task<Result<JsonNode>> GenerateAsync(AiRequest request, CancellationToken ct)
    {
        Requests.Enqueue(request);
        return Task.FromResult(Answer?.Invoke(request) ?? JsonNode.Parse(Canned(request.Task))!);
    }

    private static string Canned(AiTask task) => task switch
    {
        AiTask.DesignFromPhoto => """
            {
              "summary": "Deep green from your sign, on a dark theme",
              "settings": {
                "accent": "#2b6b4f",
                "theme": "night",
                "font": "comic-sans",
                "hero.title": "<b>Fresh</b> from the oven, every morning",
                "reviews.1.quote": "Best in town",
                "no.such.setting": "x"
              }
            }
            """,
        AiTask.WriteText => """
            {
              "settings": { "hero.title": "Knafeh worth the trip", "story.since": "1999" },
              "products": [ { "ref": "p1", "description": "Our house blend with steamed milk" }, { "ref": "p99", "description": "Not one of yours" } ]
            }
            """,
        AiTask.ChatAboutDesign => """
            {
              "reply": "I made the logo bigger, switched to the dark theme and wrote a new headline",
              "settings": {
                "logo.size": 135,
                "theme": "night",
                "texture": true,
                "font": "comic-sans",
                "hero.title": "Knafeh worth the trip",
                "reviews.1.quote": "Best in town",
                "order.action": "whatsapp",
                "hero.image": "https://elsewhere.example/x.png",
                "hours": { "sat": "closed" },
                "no.such.setting": "x"
              }
            }
            """,
        _ => """
            {
              "currency": "JOD",
              "categories": [
                { "name": "Hot drinks", "nameAr": "مشروبات ساخنة", "products": [
                  { "name": "Turkish coffee", "nameAr": "قهوة تركية", "price": 1.5 },
                  { "name": "Tea", "price": -2 }
                ] },
                { "name": "hot drinks", "products": [ { "name": "Sahlab", "description": "<i>With</i> nuts", "price": "2.25" } ] },
                { "name": "Empty", "products": [] }
              ]
            }
            """,
    };
}
