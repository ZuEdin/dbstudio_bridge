import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export const CONTAINER_PRESETS = [
  { id: 'mysql', name: 'MySQL 8.0 Server', defaultPort: 3306, env: { MYSQL_ROOT_PASSWORD: 'root', MYSQL_DATABASE: 'dbstudio_app' } },
  { id: 'postgres', name: 'PostgreSQL 16 Database', defaultPort: 5432, env: { POSTGRES_PASSWORD: 'postgres', POSTGRES_DB: 'dbstudio_app' } },
  { id: 'redis', name: 'Redis 7 Cache', defaultPort: 6379, env: {} },
  { id: 'mailpit', name: 'Mailpit SMTP Email Tester', defaultPort: 1025, webUiPort: 8025, env: {} }
];

export function generateDockerCompose(projectDir, selectedServices = ['mysql', 'redis']) {
  if (!fs.existsSync(projectDir)) {
    throw new Error(`Projektordner '${projectDir}' nicht gefunden.`);
  }

  const servicesYaml = [];

  if (selectedServices.includes('mysql')) {
    servicesYaml.push(`  db_mysql:
    image: mysql:8.0
    container_name: dbstudio_mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: dbstudio_app
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql`);
  }

  if (selectedServices.includes('postgres')) {
    servicesYaml.push(`  db_postgres:
    image: postgres:16-alpine
    container_name: dbstudio_postgres
    restart: always
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: dbstudio_app
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data`);
  }

  if (selectedServices.includes('redis')) {
    servicesYaml.push(`  cache_redis:
    image: redis:7-alpine
    container_name: dbstudio_redis
    restart: always
    ports:
      - "6379:6379"`);
  }

  if (selectedServices.includes('mailpit')) {
    servicesYaml.push(`  mailer_mailpit:
    image: axllent/mailpit:latest
    container_name: dbstudio_mailpit
    restart: always
    ports:
      - "1025:1025"
      - "8025:8025"`);
  }

  const composeContent = `version: '3.8'

services:
${servicesYaml.join('\n\n')}

volumes:
  mysql_data:
  postgres_data:
`;

  const composePath = path.join(projectDir, 'docker-compose.yml');
  fs.writeFileSync(composePath, composeContent, 'utf-8');

  return {
    success: true,
    composePath,
    servicesCount: servicesYaml.length,
    message: `docker-compose.yml mit ${servicesYaml.length} Containern erfolgreich erstellt.`
  };
}

export async function manageDockerCompose(projectDir, action = 'up') {
  const composePath = path.join(projectDir, 'docker-compose.yml');
  if (!fs.existsSync(composePath)) {
    throw new Error(`Keine docker-compose.yml in '${projectDir}' gefunden.`);
  }

  const cmd = action === 'up' 
    ? 'docker compose up -d' 
    : action === 'down' 
      ? 'docker compose down' 
      : 'docker compose ps';

  try {
    const { stdout, stderr } = await execPromise(cmd, { cwd: projectDir });
    return {
      success: true,
      action,
      output: (stdout || stderr || '').trim(),
      message: `Docker Compose ${action} erfolgreich ausgeführt.`
    };
  } catch (err) {
    return {
      success: false,
      error: `Docker Compose Fehler: ${err.message}`
    };
  }
}
