import JSZip from "jszip";

export function generateAiController(zip: JSZip) {
  zip.file("Controllers/AiController.cs", `using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace DBStudioBackend.Controllers
{
    [ApiController]
    [Route("api/ai")]
    public class AiController : ControllerBase {
        private readonly IHttpClientFactory _clientFactory;
        public AiController(IHttpClientFactory clientFactory) => _clientFactory = clientFactory;

        [HttpPost("generate-tables")]
        public async Task<IActionResult> GenerateTables([FromBody] JsonElement body) {
            string prompt = body.TryGetProperty("prompt", out var p) ? p.GetString() ?? "" : "";
            if (string.IsNullOrWhiteSpace(prompt)) return BadRequest(new { error = "Prompt ist erforderlich." });

            var generated = new List<object> {
                new {
                    id = "tbl_ai_" + Guid.NewGuid().ToString().Substring(0, 4),
                    name = "Kunden",
                    description = $"Generiert basierend auf: {prompt}",
                    fields = new[] {
                        new { id = "f_ai_k_1", name = "id", type = "INT", isPrimaryKey = true, allowNull = false, isUnique = true, defaultValue = "" },
                        new { id = "f_ai_k_2", name = "name", type = "VARCHAR(255)", isPrimaryKey = false, allowNull = false, isUnique = false, defaultValue = "" },
                        new { id = "f_ai_k_3", name = "email", type = "VARCHAR(255)", isPrimaryKey = false, allowNull = true, isUnique = true, defaultValue = "" }
                    },
                    data = new object[] {}
                },
                new {
                    id = "tbl_ai_" + Guid.NewGuid().ToString().Substring(0, 4),
                    name = "Bestellungen",
                    description = $"Generiert basierend auf: {prompt}",
                    fields = new[] {
                        new { id = "f_ai_b_1", name = "id", type = "INT", isPrimaryKey = true, allowNull = false, isUnique = true, defaultValue = "" },
                        new { id = "f_ai_b_2", name = "kunden_id", type = "INT", isPrimaryKey = false, allowNull = false, isUnique = false, defaultValue = "" },
                        new { id = "f_ai_b_3", name = "bestelldatum", type = "TIMESTAMP", isPrimaryKey = false, allowNull = false, isUnique = false, defaultValue = "CURRENT_TIMESTAMP" }
                    },
                    data = new object[] {}
                }
            };

            return Ok(new { success = true, tables = generated });
        }
    }
}
`);
}
