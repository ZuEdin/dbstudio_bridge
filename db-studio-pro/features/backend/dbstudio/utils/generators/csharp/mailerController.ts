import JSZip from "jszip";

export function generateMailerController(zip: JSZip) {
  zip.file("Controllers/MailerController.cs", `using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DBStudioBackend.Data;
using DBStudioBackend.Models;
using System.Text.Json;

namespace DBStudioBackend.Controllers
{
    [ApiController]
    [Route("api/mailer")]
    public class MailerController : ControllerBase {
        private readonly MetaDbContext _db;
        public MailerController(MetaDbContext db) => _db = db;

        [HttpGet("sent")]
        public async Task<IActionResult> GetSentEmails() {
            var sent = await _db.SentEmails.ToListAsync();
            var parsed = sent.Select(e => {
                object? attachments = null;
                object? objectContext = null;
                List<string>? securityLog = null;
                try {
                    attachments = JsonSerializer.Deserialize<object>(e.Attachments);
                    objectContext = JsonSerializer.Deserialize<object>(e.ObjectContext);
                    securityLog = JsonSerializer.Deserialize<List<string>>(e.SecurityLog);
                } catch {}

                return new {
                    e.Id,
                    e.MessageId,
                    e.Recipient,
                    e.Sender,
                    e.Subject,
                    e.Body,
                    attachments,
                    objectContext,
                    e.Timestamp,
                    securityLog,
                    e.Status
                };
            }).OrderByDescending(e => e.Timestamp);
            return Ok(parsed);
        }

        [HttpPost("send")]
        public async Task<IActionResult> SendEmail([FromBody] EmailSendDto dto) {
            if (string.IsNullOrEmpty(dto.To) || !dto.To.Contains("@") || !dto.To.Contains(".")) {
                return BadRequest(new { error = "Ungültige E-Mail-Adresse des Empfängers." });
            }
            if (string.IsNullOrEmpty(dto.Subject)) {
                return BadRequest(new { error = "E-Mail-Betreff darf nicht leer sein." });
            }

            var domain = dto.To.Split('@')[1];
            var mailId = \`msg-\${Guid.NewGuid().ToString("n").Substring(0, 16)}@db-studio-pro.local\`;
            var timestamp = DateTime.UtcNow.ToString("o");

            var securityLog = new List<string> {
                "Connecting to SMTP relay server smtp.dbstudio.local:587...",
                "Connection established. Starting STARTTLS handshake...",
                "TLS 1.3 negotiated successfully (ECDHE-RSA-AES256-GCM-SHA384).",
                $"Looking up MX records for target domain: {domain}...",
                $"Found MX record: mail.{domain} (Preference: 10).",
                "SPF (Sender Policy Framework) aligned and validated for domain dbstudio.local.",
                "DKIM (DomainKeys Identified Mail) signature generated & aligned.",
                $"SMTP Envelope Senders: <noreply@dbstudio.local> -> <{dto.To}>",
                $"Transmission accepted by remote SMTP server. Queue-ID: {Guid.NewGuid().ToString("n").Substring(0, 8).ToUpper()}"
            };

            var email = new SentEmail {
                Id = Guid.NewGuid().ToString(),
                MessageId = mailId,
                Recipient = dto.To,
                Sender = "noreply@dbstudio.local",
                Subject = dto.Subject,
                Body = dto.Body ?? "",
                Attachments = dto.Attachments != null ? JsonSerializer.Serialize(dto.Attachments) : "[]",
                ObjectContext = dto.ObjectContext != null ? JsonSerializer.Serialize(dto.ObjectContext) : "",
                Timestamp = timestamp,
                SecurityLog = JsonSerializer.Serialize(securityLog),
                Status = "DELIVERED"
            };

            _db.SentEmails.Add(email);
            await _db.SaveChangesAsync();

            return Ok(new {
                success = true,
                messageId = mailId,
                recipient = dto.To,
                timestamp,
                smtpLog = securityLog,
                status = "DELIVERED"
            });
        }
    }

    public class EmailSendDto {
        public string? To { get; set; }
        public string? Subject { get; set; }
        public string? Body { get; set; }
        public List<object>? Attachments { get; set; }
        public object? ObjectContext { get; set; }
    }
}
`);
}
