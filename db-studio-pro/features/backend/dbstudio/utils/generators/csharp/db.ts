import JSZip from "jszip";

export function generateDbFiles(zip: JSZip) {
  zip.file("Data/MetaDbContext.cs", `using Microsoft.EntityFrameworkCore;
using DBStudioBackend.Models;

namespace DBStudioBackend.Data
{
    public class MetaDbContext : DbContext {
        public MetaDbContext(DbContextOptions<MetaDbContext> options) : base(options) {}
        
        public DbSet<SysProject> SysProjects => Set<SysProject>();
        public DbSet<SysPayload> SysProjectPayloads => Set<SysPayload>();
        public DbSet<SysTable> SysTables => Set<SysTable>();
        public DbSet<SysField> SysFields => Set<SysField>();
        public DbSet<SysRelationship> SysRelationships => Set<SysRelationship>();
        public DbSet<SysQuery> SysQueries => Set<SysQuery>();
        public DbSet<SysForm> SysForms => Set<SysForm>();
        public DbSet<SysReport> SysReports => Set<SysReport>();
        public DbSet<SysPage> SysPages => Set<SysPage>();
        public DbSet<SysCustomComponent> SysCustomComponents => Set<SysCustomComponent>();
        public DbSet<SysTableData> SysTableData => Set<SysTableData>();
        public DbSet<SysUser> SysUsers => Set<SysUser>();
        public DbSet<SysChat> SysChats => Set<SysChat>();
        public DbSet<SysTicket> SysTickets => Set<SysTicket>();
        public DbSet<SysSyncHistory> SysSyncHistory => Set<SysSyncHistory>();
        public DbSet<BackendApiConfig> BackendApiConfigs => Set<BackendApiConfig>();
        public DbSet<SentEmail> SentEmails => Set<SentEmail>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<SysProject>().ToTable("sys_projects");
            modelBuilder.Entity<SysPayload>().ToTable("sys_project_payloads").HasKey(p => p.ProjectId);
            modelBuilder.Entity<SysTable>().ToTable("sys_tables");
            modelBuilder.Entity<SysField>().ToTable("sys_fields");
            modelBuilder.Entity<SysRelationship>().ToTable("sys_relationships");
            modelBuilder.Entity<SysQuery>().ToTable("sys_queries");
            modelBuilder.Entity<SysForm>().ToTable("sys_forms");
            modelBuilder.Entity<SysReport>().ToTable("sys_reports");
            modelBuilder.Entity<SysPage>().ToTable("sys_pages");
            modelBuilder.Entity<SysCustomComponent>().ToTable("sys_custom_components");
            modelBuilder.Entity<SysTableData>().ToTable("sys_table_data");
            modelBuilder.Entity<SysUser>().ToTable("sys_users");
            modelBuilder.Entity<SysChat>().ToTable("sys_chats");
            modelBuilder.Entity<SysTicket>().ToTable("sys_tickets");
            modelBuilder.Entity<SysSyncHistory>().ToTable("sys_sync_history");
            modelBuilder.Entity<BackendApiConfig>().ToTable("sys_backend_api_configs");
            modelBuilder.Entity<SentEmail>().ToTable("sys_sent_emails");
        }
    }
}
`);

  zip.file("Models/Entities.cs", `using System;

namespace DBStudioBackend.Models
{
    public class SysProject {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
        public string DbType { get; set; } = "SQLite";
        public string Language { get; set; } = "csharp";
        public int IsCloud { get; set; } = 0;
        public string OwnerId { get; set; } = "admin";
        public long LastModified { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
    }

    public class SysPayload {
        public string ProjectId { get; set; } = "";
        public string DataJson { get; set; } = "{}";
    }

    public class SysTable {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string ProjectId { get; set; } = "";
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
        public int IsApiImport { get; set; } = 0;
        public string ApiConfigJson { get; set; } = "{}";
    }

    public class SysField {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string TableId { get; set; } = "";
        public string Name { get; set; } = "";
        public string Type { get; set; } = "VARCHAR";
        public int IsPrimaryKey { get; set; } = 0;
        public int IsAutoIncrement { get; set; } = 0;
        public int IsUnique { get; set; } = 0;
        public int IsNullable { get; set; } = 1;
        public string DefaultValue { get; set; } = "";
        public string Comment { get; set; } = "";
    }

    public class SysRelationship {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string ProjectId { get; set; } = "";
        public string FromTableId { get; set; } = "";
        public string FromFieldId { get; set; } = "";
        public string ToTableId { get; set; } = "";
        public string ToFieldId { get; set; } = "";
        public string RelType { get; set; } = "1:n";
        public string OnDelete { get; set; } = "CASCADE";
    }

    public class SysQuery {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string ProjectId { get; set; } = "";
        public string Name { get; set; } = "";
        public string QueryType { get; set; } = "SELECT";
        public string RawSql { get; set; } = "";
        public string NodesJson { get; set; } = "[]";
        public string ColumnsJson { get; set; } = "[]";
    }

    public class SysForm {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string ProjectId { get; set; } = "";
        public string Name { get; set; } = "";
        public string TableId { get; set; } = "";
        public string LayoutJson { get; set; } = "[]";
    }

    public class SysReport {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string ProjectId { get; set; } = "";
        public string Name { get; set; } = "";
        public string ConfigJson { get; set; } = "{}";
    }

    public class SysPage {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string ProjectId { get; set; } = "";
        public string Name { get; set; } = "";
        public string DefinitionJson { get; set; } = "{}";
    }

    public class SysCustomComponent {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string ProjectId { get; set; } = "";
        public string Name { get; set; } = "";
        public string Type { get; set; } = "";
        public string DefinitionJson { get; set; } = "{}";
    }

    public class SysTableData {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string ProjectId { get; set; } = "proj_default";
        public string TableName { get; set; } = "";
        public string RecordId { get; set; } = "";
        public string DataJson { get; set; } = "{}";
    }

    public class SysUser {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Username { get; set; } = "";
        public string Email { get; set; } = "";
        public string PasswordHash { get; set; } = "";
        public string Role { get; set; } = "User";
        public string AdSid { get; set; } = "";
        public int IsActive { get; set; } = 1;
    }

    public class SysChat {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string ProjectId { get; set; } = "";
        public string UserId { get; set; } = "";
        public string Title { get; set; } = "";
        public string MessagesJson { get; set; } = "[]";
    }

    public class SysTicket {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string ProjectId { get; set; } = "";
        public string UserId { get; set; } = "";
        public string Title { get; set; } = "";
        public string Status { get; set; } = "OPEN";
        public string PayloadJson { get; set; } = "{}";
    }

    public class SysSyncHistory {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string ProjectId { get; set; } = "";
        public string UserId { get; set; } = "";
        public string SyncType { get; set; } = "LOCAL_TO_CLOUD";
        public string ImplementationPrompt { get; set; } = "";
        public string MetadataPayload { get; set; } = "";
    }

    public class BackendApiConfig {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = "";
        public string Url { get; set; } = "";
        public string Method { get; set; } = "GET";
        public string Headers { get; set; } = "{}";
        public string QueryParams { get; set; } = "[]";
        public string Option { get; set; } = "A";
        public int RefreshInterval { get; set; } = 0;
        public string Fields { get; set; } = "[]";
        public long LastSync { get; set; } = 0;
        public string AuthType { get; set; } = "none";
        public string AuthApiKeyName { get; set; } = "";
        public string AuthApiKeyValue { get; set; } = "";
        public string AuthApiKeyPrefix { get; set; } = "";
        public string AuthApiKeyLocation { get; set; } = "header";
        public string AuthBearerToken { get; set; } = "";
        public string AuthUsername { get; set; } = "";
        public string AuthPassword { get; set; } = "";
    }

    public class SentEmail {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string MessageId { get; set; } = "";
        public string Recipient { get; set; } = "";
        public string Sender { get; set; } = "noreply@dbstudio.local";
        public string Subject { get; set; } = "";
        public string Body { get; set; } = "";
        public string Attachments { get; set; } = "[]";
        public string ObjectContext { get; set; } = "";
        public string Timestamp { get; set; } = "";
        public string SecurityLog { get; set; } = "";
        public string Status { get; set; } = "DELIVERED";
    }
}
`);
}
