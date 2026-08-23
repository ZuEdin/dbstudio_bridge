import JSZip from "jszip";

export function generateChatController(zip: JSZip) {
  zip.file("Controllers/ChatController.cs", `using Microsoft.AspNetCore.Mvc;
using DBStudioBackend.Data;
using DBStudioBackend.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace DBStudioBackend.Controllers
{
    [ApiController]
    [Route("api/chat")]
    public class ChatController : ControllerBase {
        private readonly MetaDbContext _db;
        public ChatController(MetaDbContext db) => _db = db;

        [HttpGet("history")]
        public async Task<IActionResult> GetHistory([FromQuery] string? projectId) {
            var projId = projectId ?? "proj_default";
            var chats = await _db.SysChats.Where(c => c.ProjectId == projId).ToListAsync();
            var parsed = chats.Select(c => {
                object? messages = null;
                try {
                    messages = JsonSerializer.Deserialize<object>(c.MessagesJson);
                } catch {}
                return new { c.Id, c.Title, messages };
            });
            return Ok(parsed);
        }

        [HttpPost("save")]
        public async Task<IActionResult> SaveChat([FromBody] ChatSaveDto dto) {
            var projId = dto.ProjectId ?? "proj_default";
            var existing = await _db.SysChats.FindAsync(dto.Id);
            var msgsStr = dto.Messages != null ? JsonSerializer.Serialize(dto.Messages) : "[]";

            if (existing == null) {
                _db.SysChats.Add(new SysChat {
                    Id = dto.Id ?? Guid.NewGuid().ToString(),
                    ProjectId = projId,
                    Title = dto.Title ?? "Neuer Chat",
                    MessagesJson = msgsStr,
                    UserId = "admin"
                });
            } else {
                existing.Title = dto.Title ?? existing.Title;
                existing.MessagesJson = msgsStr;
            }

            await _db.SaveChangesAsync();
            return Ok(new { success = true });
        }
    }

    public class ChatSaveDto {
        public string? Id { get; set; }
        public string? ProjectId { get; set; }
        public string? Title { get; set; }
        public List<object>? Messages { get; set; }
    }
}
`);

  zip.file("Hubs/ChatHub.cs", `using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace DBStudioBackend.Hubs
{
    public class ChatHub : Hub {
        public async Task SendMessage(string user, string message) {
            await Clients.All.SendAsync("ReceiveMessage", user, message);
        }
    }
}
`);
}
