import JSZip from "jszip";

export function generateWebhooksController(zip: JSZip) {
  // Outbound Webhooks Controller
  zip.file("Controllers/WebhooksController.cs", `using Microsoft.AspNetCore.Mvc;
using DBStudioBackend.Services;
using System.Text.Json;

namespace DBStudioBackend.Controllers
{
    [ApiController]
    [Route("api/webhooks")]
    public class WebhooksController : ControllerBase {
        private readonly WebhookDispatcher _dispatcher;
        public WebhooksController(WebhookDispatcher dispatcher) => _dispatcher = dispatcher;

        [HttpGet("configs")]
        public IActionResult GetConfigs() => Ok(_dispatcher.GetWebhooks());

        [HttpPost("configs")]
        public IActionResult CreateConfig([FromBody] JsonElement body) {
            string url = body.GetProperty("url").GetString() ?? "";
            string eventName = body.GetProperty("eventName").GetString() ?? "";
            
            var webhook = _dispatcher.RegisterWebhook(url, eventName);
            return StatusCode(201, webhook);
        }

        [HttpDelete("configs/{id}")]
        public IActionResult DeleteConfig(string id) {
            if (_dispatcher.RemoveWebhook(id)) return Ok(new { success = true });
            return NotFound();
        }

        [HttpPost("trigger")]
        public async Task<IActionResult> TriggerWebhook([FromBody] JsonElement body) {
            string eventName = body.TryGetProperty("eventName", out var ev) ? ev.GetString() ?? "table.change" : "table.change";
            var payload = body.TryGetProperty("payload", out var pl) ? pl : default;
            
            var results = await _dispatcher.DispatchAsync(eventName, payload);
            return Ok(new { success = true, dispatchedTo = results.Count, responses = results });
        }
    }
}
`);

  // Inbound Webhooks & Event-Trigger Hub Controller
  zip.file("Controllers/InboundWebhooksController.cs", `using Microsoft.AspNetCore.Mvc;
using DBStudioBackend.Services;
using System.Text.Json;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DBStudioBackend.Controllers
{
    [ApiController]
    [Route("api/webhooks/inbound")]
    public class InboundWebhooksController : ControllerBase {
        private readonly InboundWebhookService _inboundService;
        public InboundWebhooksController(InboundWebhookService inboundService) => _inboundService = inboundService;

        [HttpGet("channels")]
        public IActionResult GetChannels() => Ok(_inboundService.GetChannels());

        [HttpGet("events")]
        public IActionResult GetRecentEvents([FromQuery] int limit = 50) => Ok(_inboundService.GetRecentEvents(limit));

        [HttpPost("stripe")]
        public async Task<IActionResult> HandleStripeWebhook([FromBody] JsonElement payload, [FromHeader(Name = "Stripe-Signature")] string? signature) {
            var ev = await _inboundService.IngestEventAsync("stripe", payload, signature ?? "simulated_stripe_signature");
            return Ok(new {
                received = true,
                provider = "Stripe",
                eventId = ev.Id,
                status = "PROCESSED",
                dispatchedAt = ev.Timestamp
            });
        }

        [HttpPost("github")]
        public async Task<IActionResult> HandleGitHubWebhook([FromBody] JsonElement payload, [FromHeader(Name = "X-GitHub-Event")] string? gitHubEvent, [FromHeader(Name = "X-Hub-Signature-256")] string? signature) {
            var ev = await _inboundService.IngestEventAsync("github", payload, signature, gitHubEvent ?? "push");
            return Ok(new {
                received = true,
                provider = "GitHub",
                gitHubEvent = gitHubEvent ?? "push",
                eventId = ev.Id,
                status = "PROCESSED"
            });
        }

        [HttpPost("iot")]
        public async Task<IActionResult> HandleIoTTelemetry([FromBody] JsonElement payload, [FromHeader(Name = "X-Device-Id")] string? deviceId) {
            var ev = await _inboundService.IngestEventAsync("iot", payload, deviceId, "telemetry");
            return Ok(new {
                received = true,
                provider = "IoT Sensor Hub",
                eventId = ev.Id,
                status = "PROCESSED"
            });
        }

        [HttpPost("{channel}")]
        public async Task<IActionResult> HandleCustomChannel(string channel, [FromBody] JsonElement payload, [FromHeader(Name = "X-Webhook-Secret")] string? secret) {
            var ev = await _inboundService.IngestEventAsync(channel, payload, secret, "custom");
            return Ok(new {
                received = true,
                channel = channel,
                eventId = ev.Id,
                status = "PROCESSED"
            });
        }
    }
}
`);

  // Outbound Dispatcher Service
  zip.file("Services/WebhookDispatcher.cs", `using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace DBStudioBackend.Services
{
    public class WebhookConfig {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Url { get; set; } = "";
        public string EventName { get; set; } = "table.change";
        public string Secret { get; set; } = Guid.NewGuid().ToString("n");
        public int IsActive { get; set; } = 1;
    }

    public class WebhookDispatcher {
        private static readonly List<WebhookConfig> _configs = new List<WebhookConfig>();
        private readonly IHttpClientFactory _clientFactory;

        public WebhookDispatcher(IHttpClientFactory clientFactory) {
            _clientFactory = clientFactory;
        }

        public List<WebhookConfig> GetWebhooks() => _configs;

        public WebhookConfig RegisterWebhook(string url, string eventName) {
            var item = new WebhookConfig { Url = url, EventName = eventName };
            _configs.Add(item);
            return item;
        }

        public bool RemoveWebhook(string id) {
            var idx = _configs.FindIndex(x => x.Id == id);
            if (idx >= 0) {
                _configs.RemoveAt(idx);
                return true;
            }
            return false;
        }

        public async Task<List<object>> DispatchAsync(string eventName, JsonElement payload) {
            var results = new List<object>();
            var targets = _configs.FindAll(w => w.EventName == eventName && w.IsActive == 1);

            if (targets.Count == 0) return results;

            var client = _clientFactory.CreateClient();
            var payloadStr = JsonSerializer.Serialize(new {
                Event = eventName,
                Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                Data = payload
            });

            foreach (var hook in targets) {
                try {
                    var request = new HttpRequestMessage(HttpMethod.Post, hook.Url) {
                        Content = new StringContent(payloadStr, Encoding.UTF8, "application/json")
                    };
                    request.Headers.Add("X-DBStudio-Signature", hook.Secret);
                    request.Headers.Add("X-DBStudio-Event", eventName);

                    var resp = await client.SendAsync(request);
                    results.Add(new {
                        webhookId = hook.Id,
                        url = hook.Url,
                        status = resp.StatusCode.ToString(),
                        isSuccess = resp.IsSuccessStatusCode
                    });
                } catch (Exception ex) {
                    results.Add(new {
                        webhookId = hook.Id,
                        url = hook.Url,
                        status = "ERROR",
                        error = ex.Message,
                        isSuccess = false
                    });
                }
            }

            return results;
        }
    }
}
`);

  // Inbound Service
  zip.file("Services/InboundWebhookService.cs", `using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace DBStudioBackend.Services
{
    public class InboundWebhookEvent {
        public string Id { get; set; } = Guid.NewGuid().ToString("n");
        public string Channel { get; set; } = "custom";
        public string EventType { get; set; } = "payload";
        public string? Signature { get; set; }
        public JsonElement Payload { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string Status { get; set; } = "PROCESSED";
    }

    public class InboundWebhookChannel {
        public string Id { get; set; } = "";
        public string Name { get; set; } = "";
        public string Provider { get; set; } = "";
        public string EndpointPath { get; set; } = "";
        public string Secret { get; set; } = "";
        public bool IsEnabled { get; set; } = true;
    }

    public class InboundWebhookService {
        private static readonly List<InboundWebhookEvent> _events = new List<InboundWebhookEvent>();
        private static readonly List<InboundWebhookChannel> _channels = new List<InboundWebhookChannel> {
            new InboundWebhookChannel { Id = "stripe_live", Name = "Stripe Payment & Invoices", Provider = "Stripe", EndpointPath = "/api/webhooks/inbound/stripe", Secret = "whsec_stripe_live_demo" },
            new InboundWebhookChannel { Id = "github_ci", Name = "GitHub Git Commits & PRs", Provider = "GitHub", EndpointPath = "/api/webhooks/inbound/github", Secret = "gh_secret_token_123" },
            new InboundWebhookChannel { Id = "iot_telemetry", Name = "IoT Sensordaten Hub", Provider = "IoT Telemetry", EndpointPath = "/api/webhooks/inbound/iot", Secret = "iot_telemetry_key_99" },
            new InboundWebhookChannel { Id = "n8n_bridge", Name = "n8n Automation Ingest", Provider = "n8n", EndpointPath = "/api/webhooks/inbound/n8n", Secret = "n8n_secret_ingest_token" }
        };

        public List<InboundWebhookChannel> GetChannels() => _channels;

        public List<InboundWebhookEvent> GetRecentEvents(int limit = 50) {
            lock (_events) {
                return _events.OrderByDescending(e => e.Timestamp).Take(limit).ToList();
            }
        }

        public Task<InboundWebhookEvent> IngestEventAsync(string channel, JsonElement payload, string? signature = null, string eventType = "payload") {
            var ev = new InboundWebhookEvent {
                Channel = channel,
                EventType = eventType,
                Signature = signature,
                Payload = payload,
                Timestamp = DateTime.UtcNow,
                Status = "PROCESSED"
            };

            lock (_events) {
                _events.Add(ev);
                if (_events.Count > 500) _events.RemoveAt(0);
            }

            return Task.FromResult(ev);
        }
    }
}
`);
}
