import JSZip from "jszip";

export function generateDeployFiles(zip: JSZip) {
  zip.file("deploy/azure/deploy-azure-python.json", `{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "webAppName": { "type": "string", "defaultValue": "dbstudio-pro-python" },
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
          "linuxFxVersion": "PYTHON|3.11",
          "appSettings": [
            { "name": "APP_ENV", "value": "production" },
            { "name": "APP_DEBUG", "value": "false" }
          ]
        }
      }
    }
  ]
}`);

  zip.file("deploy/aws/ecs-fargate-python.yml", `AWSTemplateFormatVersion: '2010-09-09'
Description: AWS CloudFormation Template fuer DB Studio Pro Python Backend auf Fargate.
Resources:
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: DBStudioPythonCluster

  LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /ecs/dbstudio-python

  TaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: dbstudio-python
      Cpu: '256'
      Memory: '512'
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      ContainerDefinitions:
        - Name: dbstudio-python
          Image: python:3.11-slim
          PortMappings:
            - ContainerPort: 8000
          Environment:
            - Name: APP_ENV
              Value: production
            - Name: APP_DEBUG
              Value: 'false'
`);

  zip.file("deploy/terraform/main.tf", `provider "aws" {
  region = "eu-central-1"
}

resource "aws_ecs_cluster" "main" {
  name = "dbstudio-python-cluster"
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "dbstudio-python-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"

  container_definitions = jsonencode([
    {
      name      = "python-backend"
      image     = "dbstudio-python:latest"
      essential = true
      portMappings = [
        {
          containerPort = 8000
          hostPort      = 8000
        }
      ]
      environment = [
        { name = "APP_ENV", value = "production" },
        { name = "APP_DEBUG", value = "false" }
      ]
    }
  ])
}
`);

  zip.file(".github/workflows/ci-cd.yml", `name: DB Studio Pro - Python CI/CD

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

    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'

    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt

    - name: Run Lint
      run: |
        pip install flake8
        flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
`);

  zip.file(".gitlab-ci.yml", `stages:
  - build
  - test

cache:
  paths:
    - .venv/

build-python:
  stage: build
  image: python:3.11-slim
  script:
    - python -m venv .venv
    - source .venv/bin/activate
    - pip install -r requirements.txt
  artifacts:
    paths:
      - .venv/
`);

  zip.file("deploy/ftp/ftp-deploy-instructions.md", `# SFTP / FTP Deployment fuer DB Studio Pro Python Backend

FastAPI ist ein moderner ASGI-Standard-Webserver und laesst sich mit Gunicorn/Uvicorn oder WSGI-Modulen wie Phusion Passenger im klassischen Webhosting aufschalten.

## Vorgehensweise:

1. **Virtual Environment**:
   Erstellen Sie eine virtuelle Umgebung im Ziel-Serverordner:
   \`\`\`bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   \`\`\`

2. **WSGI/Passenger Setup (cPanel/Plesk)**:
   - Erstellen Sie eine neue Python-App im Plesk/cPanel Admin Dashboard.
   - Setzen Sie den Application Startup File Pfad auf \`main.py\` und das Application Entry Point Object auf \`app\`.

3. **Rechtevergabe**:
   Stellen Sie sicher, dass Schreibzugriffe auf \`dbstudio_meta.db\` fuer den Webserver-User freigegeben sind.
`);

  zip.file("Dockerfile", `FROM python:3.11-slim

WORKDIR /app

# Install system dependencies if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
`);

  zip.file("docker-compose.yml", `version: '3.8'

services:
  dbstudio-python:
    build: .
    ports:
      - "8000:8000"
    environment:
      - APP_ENV=local
      - APP_DEBUG=true
      - GEMINI_API_KEY=\${GEMINI_API_KEY}
    volumes:
      - sqlite_data:/app/database
    restart: always

volumes:
  sqlite_data:
`);

  zip.file("README.md", `# DB Studio Pro - Python FastAPI Self-Host Backend

Dieses Enterprise-Starter-Kit bietet ein robustes, sicheres und vollstaendig vorkonfiguriertes Python FastAPI Backend fuer **DB Studio Pro**.

## Features:

1. **Local Authentication & Role Assignments**:
   - Sicheres Login- und Registrierungs-System unter \`/api/auth/login\` und \`/api/auth/register\`.
   - Volle Rollenzuweisungen und Benutzerverwaltung ohne Active Directory Bindung.

2. **Docker & Multi-Container Support**:
   - \`Dockerfile\` und \`docker-compose.yml\` zur schnellen Bereitstellung.

3. **Infrastructure as Code (IaC)**:
   - **Azure Resource Manager**: \`deploy/azure/deploy-azure-python.json\`.
   - **AWS CloudFormation**: \`deploy/aws/ecs-fargate-python.yml\`.
   - **HashiCorp Terraform**: \`deploy/terraform/main.tf\`.

4. **CI/CD Pipelines**:
   - **GitHub Actions**: \`.github/workflows/ci-cd.yml\`
   - **GitLab CI**: \`.gitlab-ci.yml\`

5. **Simulated SMTP Outbox & Webhooks**:
   - Protokolliertes E-Mail Versandsystem und Zapier Hooks unter \`/api/webhooks\`.

## Starten des Backends:

1. Installieren Sie **Python 3.11** oder neuer.
2. Führen Sie \`pip install -r requirements.txt\` aus.
3. Starten Sie das Backend mit \`uvicorn main:app --reload\` oder \`docker-compose up --build\`.
`);
}
