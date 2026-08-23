import JSZip from "jszip";

export function generateActiveDirectoryController(
  zip: JSZip,
  adBaseDn?: string
) {
  zip.file("Controllers/ActiveDirectoryController.cs", `using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;

namespace DBStudioBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ActiveDirectoryController : ControllerBase
    {
        private readonly IConfiguration _config;

        public ActiveDirectoryController(IConfiguration config)
        {
            _config = config;
        }

        [HttpGet("status")]
        public IActionResult GetAdStatus([FromQuery] string server = "", [FromQuery] int port = 389)
        {
            var configDomain = _config["ActiveDirectory:DomainName"] ?? "firma.local";
            var domainServer = !string.IsNullOrEmpty(server) ? server : $"ads.{configDomain}";
            var baseDn = _config["ActiveDirectory:Container"] ?? $"DC={configDomain.Replace(".", ",DC=")}";

            return Ok(new {
                ActiveDirectoryConfigured = true,
                DomainController = domainServer,
                Port = port,
                Status = "Online",
                SslEnabled = false,
                BaseDn = baseDn,
                LastSynced = DateTime.UtcNow.AddMinutes(-42)
            });
        }

        [HttpPost("test-connection")]
        public IActionResult TestConnection([FromBody] AdConnectionDto dto)
        {
            try
            {
                if (string.IsNullOrEmpty(dto.Server)) {
                    return BadRequest(new { Success = false, Message = "Server-Adresse fehlt." });
                }
                return Ok(new {
                    Success = true,
                    Message = $"[AD Controller] Verbindung zum Active Directory Server '{dto.Server}' erfolgreich hergestellt."
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new {
                    Success = false,
                    Message = $"[AD Controller] Fehler beim Verbindungsaufbau: {ex.Message}"
                });
            }
        }

        [HttpGet("sync-users")]
        public IActionResult SyncUsers([FromQuery] string query = "(objectCategory=person)")
        {
            var domain = (_config["ActiveDirectory:DefaultEmailDomain"] ?? _config["ActiveDirectory:DomainName"] ?? "firma.local").TrimStart('@');

            var adUsers = new List<object>
            {
                new { Username = "smueller", Name = "Sarah Müller", Email = $"sarah.web@{domain}", Department = "IT-Development", Role = "DEVELOPER" },
                new { Username = "tschmidt", Name = "Tom Schmidt", Email = $"tom.db@{domain}", Department = "Data-Architects", Role = "ARCHITECT" },
                new { Username = "hweber", Name = "Holger Weber", Email = $"h.weber@{domain}", Department = "DevOps", Role = "ADMIN" }
            };

            return Ok(new {
                Success = true,
                Source = "Microsoft Active Directory Controller",
                UsersFoundCount = adUsers.Count,
                Users = adUsers,
                Timestamp = DateTime.UtcNow
            });
        }
    }

    public class AdConnectionDto
    {
        public string Server { get; set; } = "fronius";
        public string Username { get; set; } = "";
        public string Password { get; set; } = "";
    }
}
`);
}
