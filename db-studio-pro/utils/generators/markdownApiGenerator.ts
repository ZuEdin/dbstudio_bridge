import { Table, BackendConfig, Query, Relationship } from '../../types/index';
import { toCamelCase } from './common';

export const generateMarkdownApiDocs = (
  tables: Table[], 
  config: BackendConfig, 
  queries: Query[] = [], 
  relationships: Relationship[] = []
): string => {
  let md = `# ${config.projectName || 'Database Studio'} - API Documentation\n\n`;
  md += `**Base URL:** \`http://localhost:${config.port}/api\`\n`;
  md += `**Backend Stack:** \`${config.language || 'Node.js Express'}\` | **Database:** \`${config.dbType || 'SQLite'}\` | **Frontend:** \`${config.frontendFramework || 'React'}\` \n\n`;
  
  md += `This document provides a comprehensive specification of all generated RESTful API endpoints, data models, custom queries, authentication flows, and relational schemas.\n\n`;
  
  // --- AUTHENTICATION & SECURITY ---
  md += `## 🔒 Authentication & Security\n\n`;
  if (config.authConfig?.useUserLogin || config.authConfig?.useWindowsAuth) {
    if (config.authConfig.useUserLogin) {
      md += `### User Login / JWT Authentication\n`;
      md += `- **Header:** \`Authorization: Bearer <token>\`\n`;
      md += `- **POST /api/auth/login** - Authenticate user credentials and retrieve JWT token.\n`;
      md += `  - **Payload:** \`{ "username": "admin", "password": "..." }\`\n`;
      md += `- **POST /api/auth/register** - Register a new user account.\n`;
      md += `  - **Payload:** \`{ "username": "newuser", "email": "user@example.com", "password": "...", "role": "User" }\`\n\n`;
    }
    if (config.authConfig.useWindowsAuth) {
      md += `### Windows Authentication (Active Directory / SSO)\n`;
      md += `- **Method:** Kerberos / NTLM / SSO\n`;
      md += `- **POST /api/auth/login-sso** - Authenticate via current Windows domain user identity.\n\n`;
      if (config.authConfig.useAdGroups) {
        md += `- **AD Group Role Mapping:** Automatically assigns application roles based on Active Directory group membership.\n\n`;
      }
    }
    md += `### Role-Based Access Control (RBAC)\n`;
    md += `Endpoints are protected according to configured role permissions (\`Admin\`, \`Manager\`, \`User\`). Requests without appropriate credentials will receive \`401 Unauthorized\` or \`403 Forbidden\` responses.\n\n`;
  } else {
    md += `Authentication is currently disabled (\`Public Access Mode\`). All endpoints are publicly accessible.\n\n`;
  }

  md += `---\n\n`;

  // --- TABLES & REST ENDPOINTS ---
  md += `## 📊 Database Tables & REST API Endpoints\n\n`;
  
  if (tables.length === 0) {
    md += `*No database tables configured yet.*\n\n`;
  } else {
    tables.forEach(table => {
      const routeName = toCamelCase(table.name);
      const pkField = table.fields.find(f => f.isPrimaryKey) || table.fields[0];
      const pkName = pkField ? toCamelCase(pkField.name) : 'id';
      
      md += `### 📁 ${table.name}\n\n`;
      md += `**Base Endpoint:** \`/api/${routeName}\`\n\n`;
      
      // Fields Table
      md += `#### Schema Fields\n`;
      md += `| Field Name | Type | Key | Nullable | Details |\n`;
      md += `| :--- | :--- | :--- | :--- | :--- |\n`;
      table.fields.forEach(f => {
        const keyTag = f.isPrimaryKey ? '🔑 PK' : '-';
        const nullTag = f.allowNull !== false && !f.isPrimaryKey ? 'Yes' : 'No';
        md += `| \`${toCamelCase(f.name)}\` | \`${f.type}\` | ${keyTag} | ${nullTag} | ${f.isAutoIncrement ? 'Auto Increment' : (f.comment || '-')} |\n`;
      });
      md += `\n`;

      // Endpoints Specification
      md += `#### Endpoints\n\n`;

      md += `##### 1. GET \`/api/${routeName}\`\n`;
      md += `Retrieve all records from \`${table.name}\`.\n`;
      md += `- **Response 200:** Array of \`${table.name}\` objects.\n\n`;

      md += `##### 2. GET \`/api/${routeName}/:${pkName}\`\n`;
      md += `Retrieve a single record from \`${table.name}\` by primary key.\n`;
      md += `- **Response 200:** Single \`${table.name}\` object.\n`;
      md += `- **Response 404:** Record not found.\n\n`;

      md += `##### 3. POST \`/api/${routeName}\`\n`;
      md += `Create a new record in \`${table.name}\`.\n\n`;
      md += `**Example Request Payload:**\n\`\`\`json\n{\n`;
      const payloadLines: string[] = [];
      table.fields.filter(f => !f.isAutoIncrement).forEach(f => {
        let exampleVal = '"sample"';
        if (f.type === 'INTEGER' || f.type === 'DECIMAL' || f.type === 'DOUBLE' || f.type === 'TINYINT') exampleVal = '100';
        if (f.type === 'BOOLEAN') exampleVal = 'true';
        if (f.type === 'DATE' || f.type === 'DATETIME' || f.type === 'TIMESTAMP') exampleVal = '"2026-01-01T12:00:00Z"';
        payloadLines.push(`  "${toCamelCase(f.name)}": ${exampleVal}`);
      });
      md += payloadLines.join(',\n') + `\n}\n\`\`\`\n\n`;

      md += `##### 4. PUT \`/api/${routeName}/:${pkName}\`\n`;
      md += `Update an existing record in \`${table.name}\` by primary key.\n`;
      md += `- **Response 200:** Updated \`${table.name}\` object.\n\n`;

      md += `##### 5. DELETE \`/api/${routeName}/:${pkName}\`\n`;
      md += `Delete a record from \`${table.name}\` by primary key.\n`;
      md += `- **Response 200:** \`{ "success": true, "message": "Record deleted" }\`\n\n`;

      md += `---\n\n`;
    });
  }

  // --- QUERIES & CUSTOM VIEWS ---
  md += `## 🔍 Custom Queries & Database Views\n\n`;
  if (queries.length === 0) {
    md += `*No custom queries defined.*\n\n`;
  } else {
    queries.forEach(query => {
      const qRoute = toCamelCase(query.name);
      const qType = query.type || 'SELECT';
      
      md += `### ⚡ ${query.name} (\`${qType}\` Query)\n\n`;
      md += `**Endpoint:** \`${qType === 'SELECT' ? 'GET' : 'POST'} /api/queries/${qRoute}\`\n\n`;

      if (query.type === 'SELECT') {
        md += `#### Selected Output Columns\n`;
        md += `| Column Name | Table | Field Name | Alias |\n`;
        md += `| :--- | :--- | :--- | :--- |\n`;
        query.columns.forEach(col => {
          md += `| \`${col.fieldName || '-'}\` | \`${col.tableName || '-'}\` | \`${col.fieldName || '-'}\` | \`${col.alias || '-'}\` |\n`;
        });
        md += `\n`;
      } else if (query.type === 'INSERT') {
        md += `#### Action Details (INSERT Query)\n`;
        const sourceTable = tables.find(t => t.id === query.sourceTableId)?.name || query.sourceTableId;
        const targetTable = tables.find(t => t.id === query.targetTableId)?.name || query.targetTableId;
        md += `- **Source Table:** \`${sourceTable}\`\n`;
        md += `- **Target Table:** \`${targetTable}\`\n\n`;
      } else if (query.type === 'UPDATE' || query.type === 'DELETE') {
        md += `#### Action Details (${query.type} Query)\n`;
        const targetTable = tables.find(t => t.id === query.targetTableId)?.name || query.targetTableId;
        md += `- **Target Table:** \`${targetTable}\`\n\n`;

        if (query.criteria && query.criteria.length > 0) {
          md += `#### Criteria / Filter Conditions\n`;
          md += `| Operator | Value / Parameter |\n`;
          md += `| :--- | :--- |\n`;
          query.criteria.forEach(crit => {
            md += `| \`${crit.operator}\` | \`${crit.value || 'Parameter'}\` |\n`;
          });
          md += `\n`;
        }
      }

      md += `---\n\n`;
    });
  }

  // --- RELATIONSHIPS & FOREIGN KEYS ---
  if (relationships.length > 0) {
    md += `## 🔗 Database Relationships & Foreign Keys\n\n`;
    md += `| Primary / Source Table | Primary Key | Foreign / Child Table | Foreign Key | Type | On Delete |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    relationships.forEach(rel => {
      const sourceT = tables.find(t => t.id === rel.fromTableId);
      const targetT = tables.find(t => t.id === rel.toTableId);
      const sourceName = sourceT ? sourceT.name : rel.fromTableId;
      const targetName = targetT ? targetT.name : rel.toTableId;
      
      const sourceField = sourceT?.fields.find(f => f.id === rel.fromFieldId)?.name || rel.fromFieldId;
      const targetField = targetT?.fields.find(f => f.id === rel.toFieldId)?.name || rel.toFieldId;

      md += `| \`${sourceName}\` | \`${sourceField}\` | \`${targetName}\` | \`${targetField}\` | \`${rel.type || '1:n'}\` | \`${rel.onDelete || 'NO ACTION'}\` |\n`;
    });
    md += `\n---\n\n`;
  }

  // --- UTILITY ENDPOINTS ---
  md += `## 🛠 System & Utility Endpoints\n\n`;
  md += `### GET \`/api/health\`\n`;
  md += `Health check endpoint to verify backend server status.\n`;
  md += `- **Response 200:** \`{ "status": "ok", "service": "${config.projectName || 'DB Studio Pro'}" }\`\n\n`;

  if (config.authConfig?.useWindowsAuth) {
    md += `### GET \`/api/ad/search?q={query}\`\n`;
    md += `Search Active Directory users/groups by keyword (for user pickers and domain lookup).\n\n`;
  }

  return md;
};
