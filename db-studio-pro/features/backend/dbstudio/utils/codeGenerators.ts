import { Table } from '../../../../types/index';
import { RbacRole } from '../types';

// Central Dynamic Template Generator for Cloud Hub
export const getGeneratedCodeForTab = (
  tab: 'sql' | 'backend' | 'auth',
  tpl: 'express' | 'nestjs',
  prov: 'jwt' | 'google' | 'github',
  rls: boolean,
  tables: Table[],
  selectedTables: Record<string, boolean>,
  implementGoal: string
): string => {
  const activeTables = tables.filter(t => selectedTables[t.id]);

  if (tab === 'sql') {
    const sqlTables = activeTables.map(t => {
      const fieldsSql = t.fields
        .map(f => {
          let sql = `  ${f.name} ${f.type === 'INTEGER' ? 'SERIAL' : f.type === 'VARCHAR' ? 'VARCHAR(255)' : f.type}`;
          if (f.isPrimaryKey) sql += ' PRIMARY KEY';
          if (f.isUnique) sql += ' UNIQUE';
          if (!f.allowNull && !f.isPrimaryKey) sql += ' NOT NULL';
          return sql;
        })
        .join(',\n');
      return `CREATE TABLE IF NOT EXISTS ${t.name.toLowerCase()} (\n${fieldsSql}\n);\n`;
    }).join('\n');

    const rlsSql = rls ? activeTables.map(t => `ALTER TABLE ${t.name.toLowerCase()} ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON ${t.name.toLowerCase()} 
  USING (tenant_id = current_setting('app.current_tenant_id'));`).join('\n') : '';

    return `-- ==========================================
-- DB STUDIO GENERATED MIGRATION
-- TYPE: LOCAL_TO_CLOUD
-- GOAL: ${implementGoal}
-- ==========================================

-- 1. Update System Meta-Database
INSERT INTO sys_sync_history (id, project_id, user_id, sync_type, implementation_prompt, created_at)
VALUES (
  '${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'uuid-placeholder-' + Math.random().toString(36).substring(2, 10)}', 
  'sys_proj_active_1', 
  'dev_user_u1', 
  'LOCAL_TO_CLOUD', 
  '${implementGoal.replace(/'/g, "''")}', 
  CURRENT_TIMESTAMP
);

-- 2. Create target tables in Cloud (PostgreSQL Dialect)
${sqlTables}
${rls ? `
-- 3. Row-Level Security Policies for Multi-Tenant Isolation
${rlsSql}
` : ''}`;
  }

  if (tab === 'backend') {
    if (tpl === 'express') {
      const expressRoutes = activeTables.map(t => {
        const lowerName = t.name.toLowerCase();
        const zodSchema = `const ${t.name}Schema = z.object({\n${t.fields.map(f => `  ${f.name}: ${f.type === 'INTEGER' ? 'z.number()' : f.type === 'BOOLEAN' ? 'z.boolean()' : 'z.string()'}`).join(',\n')}\n});`;

        return `// ==========================================
// ${t.name} CRUD Routes with Multi-Tenant RLS
// ==========================================
${zodSchema}

// List all ${lowerName} for authorized tenant
router.get('/api/${lowerName}', authenticateUser, rlsContextMiddleware, async (req: any, res: any) => {
  try {
    const records = await db('${lowerName}'); // PostgreSQL RLS limits output to tenantId automatically
    res.json({ success: true, data: records });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create ${lowerName} within active tenant
router.post('/api/${lowerName}', authenticateUser, rlsContextMiddleware, async (req: any, res: any) => {
  try {
    const validatedData = ${t.name}Schema.parse(req.body);
    const [newRecord] = await db('${lowerName}')
      .insert({ ...validatedData, tenant_id: req.user.tenantId })
      .returning('*');
    res.status(201).json({ success: true, data: newRecord });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});`;
      }).join('\n\n');

      return `/**
 * DB Studio Pro - Express Cloud Hub Router
 * Objective: ${implementGoal}
 */
import express from 'express';
import { db } from './db/connection';
import { authenticateUser } from './middleware/auth';
import { z } from 'zod';

const router = express.Router();

// Middleware to set tenant context in database session for PostgreSQL Row-Level Security (RLS)
const rlsContextMiddleware = async (req: any, res: any, next: any) => {
  if (req.user && req.user.tenantId) {
    // Sets the local variable in this connection session for RLS policy enforcement
    await db.raw("SET LOCAL app.current_tenant_id = ?", [req.user.tenantId]);
  }
  next();
};

${expressRoutes}

export default router;`;
    } else {
      // NestJS
      const nestControllers = activeTables.map(t => {
        const lowerName = t.name.toLowerCase();
        return `  // --- ${t.name} CRUD Endpoints ---
  @Get('${lowerName}')
  @ApiOperation({ summary: 'List all ${lowerName} for active tenant' })
  async findAll${t.name}(@TenantId() tenantId: string) {
    try {
      // NestJS Service enforces Row-Level Isolation at DB session level
      return await this.tablesService.findForTenant('${lowerName}', tenantId);
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('${lowerName}')
  @ApiOperation({ summary: 'Create a new ${lowerName} in active tenant' })
  async create${t.name}(@TenantId() tenantId: string, @Body() body: any) {
    try {
      return await this.tablesService.createInTenant('${lowerName}', tenantId, body);
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }`;
      }).join('\n\n');

      return `/**
 * DB Studio Pro - NestJS Cloud Hub Controller
 * Objective: ${implementGoal}
 */
import { Controller, Get, Post, Body, UseGuards, Req, HttpStatus, HttpException } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { TenantId } from './auth/tenant-id.decorator';
import { TablesService } from './tables.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('cloud-hub')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api')
export class CloudHubController {
  constructor(private readonly tablesService: TablesService) {}

${nestControllers}
}`;
    }
  }

  if (tab === 'auth') {
    if (tpl === 'express') {
      if (prov === 'jwt') {
        return `/**
 * DB Studio Pro - JWT Express Authentication Middleware
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dbstudio-cloudhub-super-secret-key-2026';

export const authenticateUser = (req: any, res: any, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authorization token missing or invalid' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.userId,
      username: decoded.username,
      tenantId: decoded.tenantId, // Tenant ID used for Row Level Security (RLS)
      role: decoded.role || 'User'
    };
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};`;
      } else if (prov === 'google') {
        return `/**
 * DB Studio Pro - Passport Google OAuth2 Strategy (Express)
 */
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { db } from '../db/connection';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists or register them in our system schema
      let user = await db('sys_users').where('sso_provider_id', profile.id).first();
      
      if (!user) {
        // Register and assign to a unique Tenant ID for Row Level Security (RLS)
        const tenantId = 'tenant-' + Math.random().toString(36).substring(2, 10);
        [user] = await db('sys_users').insert({
          username: profile.emails?.[0]?.value || profile.displayName,
          sso_provider: 'google',
          sso_provider_id: profile.id,
          tenant_id: tenantId,
          role: 'User'
        }).returning('*');
      }
      
      return done(null, {
        id: user.id,
        username: user.username,
        tenantId: user.tenant_id,
        role: user.role
      });
    } catch (err) {
      return done(err);
    }
  }
));`;
      } else {
        return `/**
 * DB Studio Pro - Passport GitHub OAuth2 Strategy (Express)
 */
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { db } from '../db/connection';

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID || 'your-github-client-id',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'your-github-client-secret',
    callbackURL: "/api/auth/github/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists or register them in our system schema
      let user = await db('sys_users').where('sso_provider_id', profile.id).first();
      
      if (!user) {
        // Register and assign to a unique Tenant ID for Row Level Security (RLS)
        const tenantId = 'tenant-' + Math.random().toString(36).substring(2, 10);
        [user] = await db('sys_users').insert({
          username: profile.username || profile.displayName,
          sso_provider: 'github',
          sso_provider_id: profile.id,
          tenant_id: tenantId,
          role: 'User'
        }).returning('*');
      }
      
      return done(null, {
        id: user.id,
        username: user.username,
        tenantId: user.tenant_id,
        role: user.role
      });
    } catch (err) {
      return done(err);
    }
  }
));`;
      }
    } else {
      // NestJS
      if (prov === 'jwt') {
        return `/**
 * DB Studio Pro - NestJS JWT Authentication Strategy
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dbstudio-cloudhub-super-secret-key-2026',
    });
  }

  async validate(payload: any) {
    if (!payload || !payload.tenantId) {
      throw new UnauthorizedException('Invalid token payload: tenantId is required.');
    }
    return { 
      userId: payload.sub, 
      username: payload.username, 
      tenantId: payload.tenantId, // Used directly by RLS interceptors
      role: payload.role 
    };
  }
}`;
      } else if (prov === 'google') {
        return `/**
 * DB Studio Pro - NestJS Google OAuth2 Strategy
 */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    const { name, emails, photos } = profile;
    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      accessToken,
      tenantId: 'tenant-' + profile.id.substring(0, 8) // Mandantenzuordnung via RLS
    };
    done(null, user);
  }
}`;
      } else {
        return `/**
 * DB Studio Pro - NestJS GitHub OAuth2 Strategy
 */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor() {
    super({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/api/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: any): Promise<any> {
    const user = {
      username: profile.username,
      displayName: profile.displayName,
      email: profile.emails?.[0]?.value || '',
      accessToken,
      tenantId: 'tenant-' + profile.id.substring(0, 8) // Tenant-Isolierung für Postgres RLS
    };
    done(null, user);
  }
}`;
      }
    }
  }

  return '';
};

export const generateFullProjectCode = (
  selfHostLang: 'nodejs' | 'csharp' | 'php' | 'python',
  tables: Table[]
): string => {
  if (selfHostLang === 'csharp') {
    return `// .NET C# Enterprise Backend API - Generated by DB Studio Pro
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();
app.UseRouting();
app.UseAuthorization();

${tables.map(t => `// API Endpoint: /api/${t.name.toLowerCase()}
app.MapGet("/api/${t.name.toLowerCase()}", () => Results.Ok(new[] { new { Id = 1, Status = "Live Active Entity from .NET Runner" } }));`).join('\n')}

app.Run();`;
  }

  return `// Node.js Express Enterprise API - Generated by DB Studio Pro
const express = require('express');
const app = express();
app.use(express.json());

${tables.map(t => `app.get('/api/${t.name.toLowerCase()}', (req, res) => {
  res.json({ success: true, data: [{ id: 1, name: "${t.name} Item", status: "Live Active Entity from Node Runner" }] });
});`).join('\n')}

app.get('/api/health', (req, res) => {
  res.json({ status: "ok", service: "DB Studio Dynamic Runner", timestamp: new Date().toISOString() });
});

module.exports = app;`;
};

export const generateMigrationScripts = (
  dialect: 'sql' | 'drizzle' | 'knex' | 'prisma',
  tables: Table[],
  selectedTables: Record<string, boolean>
): string => {
  const activeTables = tables.filter(t => selectedTables[t.id]);
  const ts = new Date().toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14);

  if (dialect === 'drizzle') {
    return `// Drizzle ORM Schema Export (${ts})
import { pgTable, serial, text, varchar, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

${activeTables.map(t => `export const ${t.name.toLowerCase()} = pgTable('${t.name.toLowerCase()}', {
${t.fields.map(f => `  ${f.name}: ${f.type === 'INTEGER' ? 'integer' : 'varchar'}('${f.name}')${f.isPrimaryKey ? '.primaryKey()' : ''}${!f.allowNull ? '.notNull()' : ''}`).join(',\n')}
});`).join('\n\n')}`;
  }

  if (dialect === 'knex') {
    return `// Knex.js Migration File (${ts}_create_schema.js)
exports.up = function(knex) {
  return knex.schema
${activeTables.map(t => `    .createTable('${t.name.toLowerCase()}', function(table) {
${t.fields.map(f => `      table.${f.type === 'INTEGER' ? 'integer' : 'string'}('${f.name}')${f.isPrimaryKey ? '.primaryKey()' : ''};`).join('\n')}
    })`).join('\n')};
};

exports.down = function(knex) {
  return knex.schema
${activeTables.map(t => `    .dropTableIfExists('${t.name.toLowerCase()}')`).join('\n')};
};`;
  }

  if (dialect === 'prisma') {
    return `// Prisma Schema Export (${ts})
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

${activeTables.map(t => `model ${t.name} {
${t.fields.map(f => `  ${f.name} ${f.type === 'INTEGER' ? 'Int' : 'String'} ${f.isPrimaryKey ? '@id @default(autoincrement())' : ''}`).join('\n')}
}`).join('\n\n')}`;
  }

  // Default SQL
  return `-- ==========================================
-- MIGRATION: ${ts}_001_initial_schema.sql
-- ==========================================

${activeTables.map(t => `CREATE TABLE IF NOT EXISTS ${t.name.toLowerCase()} (
${t.fields.map(f => `  ${f.name} ${f.type === 'INTEGER' ? 'INT' : 'VARCHAR(255)'}${f.isPrimaryKey ? ' PRIMARY KEY' : ''}`).join(',\n')}
);`).join('\n\n')}

-- ROLLBACK SCRIPT:
${activeTables.map(t => `DROP TABLE IF EXISTS ${t.name.toLowerCase()};`).join('\n')}`;
};

export const generateRlsPolicies = (
  tables: Table[],
  selectedTables: Record<string, boolean>,
  rbacRoles: RbacRole[]
): string => {
  const activeTables = tables.filter(t => selectedTables[t.id]);
  return `-- ==========================================
-- ROW LEVEL SECURITY (RLS) & RBAC POLICIES
-- ==========================================

-- Enable Row Level Security on all active tables
${activeTables.map(t => `ALTER TABLE ${t.name.toLowerCase()} ENABLE ROW LEVEL SECURITY;`).join('\n')}

-- RBAC Policies for Role Matrix
${rbacRoles.map(role => {
  return `-- Policy for Role: ${role.name} (${role.description})
${activeTables.map(t => {
    const perm = role.permissions[t.name] || { read: false, create: false, update: false, delete: false };
    const policies = [];
    if (perm.read) {
      policies.push(`CREATE POLICY "${t.name.toLowerCase()}_select_${role.name.toLowerCase()}" ON ${t.name.toLowerCase()} FOR SELECT TO ${role.name.toLowerCase()} USING (true);`);
    }
    if (perm.create) {
      policies.push(`CREATE POLICY "${t.name.toLowerCase()}_insert_${role.name.toLowerCase()}" ON ${t.name.toLowerCase()} FOR INSERT TO ${role.name.toLowerCase()} WITH CHECK (auth.role() = '${role.name}');`);
    }
    if (perm.update) {
      policies.push(`CREATE POLICY "${t.name.toLowerCase()}_update_${role.name.toLowerCase()}" ON ${t.name.toLowerCase()} FOR UPDATE TO ${role.name.toLowerCase()} USING (auth.uid() = user_id OR auth.role() = 'ADMIN');`);
    }
    if (perm.delete) {
      policies.push(`CREATE POLICY "${t.name.toLowerCase()}_delete_${role.name.toLowerCase()}" ON ${t.name.toLowerCase()} FOR DELETE TO ${role.name.toLowerCase()} USING (auth.role() = 'ADMIN');`);
    }
    return policies.join('\n');
  }).filter(Boolean).join('\n')}`;
}).join('\n\n')}`;
};

export const generateRbacMiddlewareCode = (): string => {
  return `// Express.js JWT & RBAC Middleware Generator
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'db_studio_secret_key';

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Token invalid or expired' });
    (req as any).user = user;
    next();
  });
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role || 'GUEST';
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: \`Forbidden: Role '\${userRole}' lacks privileges.\` 
      });
    }
    next();
  };
}`;
};

export const generateOpenApiSpec = (
  tables: Table[],
  selectedTables: Record<string, boolean>,
  implementGoal: string,
  remoteServerUrl: string
): string => {
  const activeTables = tables.filter(t => selectedTables[t.id]);
  const paths: any = {};

  activeTables.forEach(t => {
    const name = t.name.toLowerCase();
    paths[`/api/data/${name}`] = {
      get: {
        summary: `Alle Eintragszeilen für ${t.name} abrufen`,
        responses: { "200": { description: "Erfolgreich", content: { "application/json": {} } } }
      },
      post: {
        summary: `Neuen Datensatz in ${t.name} erstellen`,
        requestBody: { content: { "application/json": { schema: { type: "object" } } } },
        responses: { "201": { description: "Erstellt" } }
      }
    };
  });

  return JSON.stringify({
    openapi: "3.0.0",
    info: { title: "DB Studio Pro Self-Host REST API", version: "1.0.0", description: implementGoal },
    servers: [{ url: remoteServerUrl }],
    paths
  }, null, 2);
};

export const generatePostmanCollection = (
  tables: Table[],
  selectedTables: Record<string, boolean>,
  remoteServerUrl: string
): string => {
  const activeTables = tables.filter(t => selectedTables[t.id]);
  const items = activeTables.map(t => {
    const name = t.name.toLowerCase();
    return {
      name: `Table: ${t.name}`,
      item: [
        {
          name: `Get All ${t.name}`,
          request: { method: "GET", url: { raw: `{{baseUrl}}/api/data/${name}` } }
        },
        {
          name: `Create ${t.name}`,
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: { mode: "raw", raw: JSON.stringify(t.fields.reduce((acc: any, f) => { acc[f.name] = f.type === 'INTEGER' ? 1 : 'Sample'; return acc; }, {}), null, 2) },
            url: { raw: `{{baseUrl}}/api/data/${name}` }
          }
        }
      ]
    };
  });

  return JSON.stringify({
    info: { name: "DB Studio Pro Postman Collection", schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json" },
    variable: [{ key: "baseUrl", value: remoteServerUrl }],
    item: items
  }, null, 2);
};
