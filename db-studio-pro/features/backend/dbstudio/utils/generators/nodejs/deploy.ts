import JSZip from "jszip";

export function generateDeployFiles(zip: JSZip) {
  // Azure ARM Resource Template JSON
  zip.file("deploy/azure/deploy-azure-node.json", `{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "webAppName": { "type": "string", "defaultValue": "dbstudio-pro-node" },
    "sku": { "type": "string", "defaultValue": "F1" }
  },
  "resources": [
    {
      "type": "Microsoft.Web/serverfarms",
      "apiVersion": "2020-06-01",
      "name": "[concat(parameters('webAppName'), '-plan')]",
      "location": "[resourceGroup().location]",
      "sku": { "name": "[parameters('sku')]" },
      "kind": "linux",
      "properties": { "reserved": true }
    },
    {
      "type": "Microsoft.Web/sites",
      "apiVersion": "2020-06-01",
      "name": "[parameters('webAppName')]",
      "location": "[resourceGroup().location]",
      "dependsOn": [
        "[resourceId('Microsoft.Web/serverfarms', concat(parameters('webAppName'), '-plan'))]"
      ],
      "properties": {
        "serverFarmId": "[resourceId('Microsoft.Web/serverfarms', concat(parameters('webAppName'), '-plan'))]",
        "siteConfig": {
          "linuxFxVersion": "NODE|20-lts",
          "appSettings": [
            { "name": "NODE_ENV", "value": "production" },
            { "name": "PORT", "value": "3000" }
          ]
        }
      }
    }
  ]
}`);

  // AWS CloudFormation YML stack template
  zip.file("deploy/aws/ecs-fargate-node.yml", `AWSTemplateFormatVersion: '2010-09-09'
Description: AWS CloudFormation Template fuer DB Studio Pro Node.js Express Backend auf Fargate.
Resources:
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: DBStudioNodeCluster

  LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /ecs/dbstudio-node

  TaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: dbstudio-node
      Cpu: '256'
      Memory: '512'
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      ContainerDefinitions:
        - Name: dbstudio-node
          Image: node:20-alpine
          PortMappings:
            - ContainerPort: 3000
          Environment:
            - Name: NODE_ENV
              Value: production
            - Name: PORT
              Value: '3000'
`);

  // HashiCorp Terraform configuration file
  zip.file("deploy/terraform/main.tf", `provider "aws" {
  region = "eu-central-1"
}

resource "aws_ecs_cluster" "main" {
  name = "dbstudio-node-cluster"
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "dbstudio-node-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"

  container_definitions = jsonencode([
    {
      name      = "node-backend"
      image     = "dbstudio-node:latest"
      essential = true
      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
        }
      ]
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "3000" }
      ]
    }
  ])
}
`);

  // CI/CD workflow pipeline
  zip.file(".github/workflows/ci-cd.yml", `name: DB Studio Pro - Node.js Express CI/CD

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main" ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Use Node.js 20.x
      uses: actions/setup-node@v3
      with:
        node-version: 20.x
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run Schema Initialization
      run: npm run initdb
`);

  zip.file(".gitlab-ci.yml", `stages:
  - build
  - test

cache:
  paths:
    - node_modules/

build-node:
  stage: build
  image: node:20-alpine
  script:
    - npm install
  artifacts:
    paths:
      - node_modules/
`);

  // SFTP / FTP Deployment instruction file
  zip.file("deploy/ftp/ftp-deploy-instructions.md", `# SFTP / FTP Deployment fuer DB Studio Pro Node.js Express Backend

Node.js ist eine ereignisgesteuerte, serverseitige JavaScript-Laufzeitumgebung und laesst sich hervorragend ueber Phusion Passenger (cPanel/Plesk) oder einen reverse-Proxy wie Nginx betreiben.

## Vorgehensweise:

1. **Dateien übertragen**:
   Laden Sie den gesamten Projektordner (ohne \`node_modules\`) auf Ihren FTP-Server hoch.

2. **Abhaengigkeiten installieren**:
   Oeffnen Sie die SSH-Konsole im Ziel-Serverordner und fuehren Sie aus:
   \`\`\`bash
   npm install --production
   npm run initdb
   \`\`\`

3. **Passenger Setup (cPanel/Plesk)**:
   - Erstellen Sie ein neues Node.js-Projekt im Plesk/cPanel Admin Panel.
   - Setzen Sie die Application Startup File auf \`server.js\`.
   - Starten Sie die Node.js App.

4. **Rechtevergabe**:
   Stellen Sie sicher, dass Schreibzugriffe auf \`dbstudio_meta.db\` fuer den Webserver-User freigegeben sind.
`);

  // Docker profiles
  zip.file("Dockerfile", `FROM node:20-alpine

WORKDIR /app

# Install native dependencies if sqlite3 needs compiling
RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
`);

  zip.file("docker-compose.yml", `version: '3.8'

services:
  dbstudio-node:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - GEMINI_API_KEY=\${GEMINI_API_KEY}
      - JWT_SECRET=super_secret_jwt_key_1234
    volumes:
      - sqlite_data:/app/database
    restart: always

volumes:
  sqlite_data:
`);

  // README description
  zip.file("README.md", `# DB Studio Pro - Node.js Express Self-Host Backend

Dieses Enterprise-Starter-Kit bietet ein robustes, sicheres und vollstaendig vorkonfiguriertes Node.js Express Backend fuer **DB Studio Pro**.

## Features:

1. **Local Authentication & Role Assignments**:
   - Sicheres Login- und Registrierungs-System unter \`/api/auth/login\` und \`/api/auth/register\`.
   - Lokales AD-Whoami-Emulationssystem fuer Benutzer-Rollen ohne Active Directory Bindung.

2. **Docker & Multi-Container Support**:
   - \`Dockerfile\` und \`docker-compose.yml\` zur schnellen Bereitstellung.

3. **Infrastructure as Code (IaC)**:
   - **Azure Resource Manager**: \`deploy/azure/deploy-azure-node.json\`.
   - **AWS CloudFormation**: \`deploy/aws/ecs-fargate-node.yml\`.
   - **HashiCorp Terraform**: \`deploy/terraform/main.tf\`.

4. **CI/CD Pipelines**:
   - **GitHub Actions**: \`.github/workflows/ci-cd.yml\`
   - **GitLab CI**: \`.gitlab-ci.yml\`

5. **Simulated SMTP Outbox & Webhooks**:
   - Protokolliertes E-Mail Versandsystem und Zapier Hooks unter \`/api/webhooks\`.

## Starten des Backends:

1. Führen Sie \`npm install\` aus.
2. Führen Sie \`npm run initdb\` aus.
3. Starten Sie das Backend mit \`npm run dev\` oder \`npm start\` oder \`docker-compose up --build\`.
`);
}
