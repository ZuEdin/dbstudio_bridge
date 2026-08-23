import JSZip from "jszip";

export function generateAppSettings(
  zip: JSZip,
  adServerAddress?: string,
  adBaseDn?: string,
  adServiceAccountUsername?: string,
  adServiceAccountPassword?: string
) {
  let domainName = "firma.local";
  if (adServerAddress) {
    let cleaned = adServerAddress.replace(/^ldaps?:\/\//i, "");
    cleaned = cleaned.split(":")[0];
    domainName = cleaned || "firma.local";
  }

  zip.file("appsettings.json", JSON.stringify({
    Logging: {
      LogLevel: {
        Default: "Information",
        "Microsoft.AspNetCore": "Warning"
      }
    },
    AllowedHosts: "*",
    GEMINI_API_KEY: "",
    Jwt: {
      Key: "db_studio_pro_enterprise_security_key_2026"
    },
    ActiveDirectory: {
      DomainName: domainName,
      NetBiosName: domainName.split('.')[0] || "firma",
      DefaultEmailDomain: domainName,
      Container: adBaseDn || `DC=${domainName.replace(/\./g, ",DC=")}`,
      ServiceAccountUsername: adServiceAccountUsername || "",
      ServiceAccountPassword: adServiceAccountPassword || "",
      DefaultRoles: ["Administrator", "Manager", "Developer", "User", "Guest"],
      RoleMappings: [
        { AdGroup: "firma\\administratoren", AppRole: "Administrator" },
        { AdGroup: "firma\\manager", AppRole: "Manager" },
        { AdGroup: "firma\\coder", AppRole: "Developer" },
        { AdGroup: "firma\\entwickler", AppRole: "Developer" },
        { AdGroup: "firma\\user", AppRole: "User" },
        { AdGroup: "firma\\gast", AppRole: "Guest" }
      ]
    }
  }, null, 2));
}
