import JSZip from "jszip";

export function generateDeployFiles(zip: JSZip) {
  zip.file("deploy/azure/deploy-azure.bicep", `param webAppName string = 'dbstudio-pro-backend'
param location string = resourceGroup().location
param sku string = 'F1'

resource appServicePlan 'Microsoft.Web/serverfarms@2021-02-01' = {
  name: '\${webAppName}-plan'
  location: location
  sku: {
    name: sku
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

resource webApp 'Microsoft.Web/sites@2021-02-01' = {
  name: webAppName
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'DOTNET|10.0'
      appSettings: [
        {
          name: 'ASPNETCORE_ENVIRONMENT'
          value: 'Production'
        },
        {
          name: 'Jwt__Key'
          value: 'db_studio_pro_enterprise_security_key_2026'
        }
      ]
    }
  }
}
`);

  zip.file("deploy/aws/ecs-fargate.yml", `AWSTemplateFormatVersion: '2010-09-09'
Description: AWS CloudFormation Template fuer DB Studio Pro Backend auf ECS Fargate.
Resources:
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: DBStudioCluster

  LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /ecs/dbstudio-backend

  TaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: dbstudio-backend
      Cpu: '256'
      Memory: '512'
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      ContainerDefinitions:
        - Name: dbstudio-backend
          Image: mcr.microsoft.com/dotnet/aspnet:10.0
          PortMappings:
            - ContainerPort: 80
          Environment:
            - Name: ASPNETCORE_ENVIRONMENT
              Value: Production
            - Name: Jwt__Key
              Value: db_studio_pro_enterprise_security_key_2026
`);

  zip.file("deploy/terraform/main.tf", `provider "aws" {
  region = "eu-central-1"
}

resource "aws_ecs_cluster" "main" {
  name = "dbstudio-pro-cluster"
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "dbstudio-backend-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "dbstudio-backend:latest"
      essential = true
      portMappings = [
        {
          containerPort = 80
          hostPort      = 80
        }
      ]
      environment = [
        { name = "ASPNETCORE_ENVIRONMENT", value = "Production" },
        { name = "Jwt__Key", value = "db_studio_pro_enterprise_security_key_2026" }
      ]
    }
  ])
}
`);

  zip.file(".github/workflows/ci-cd.yml", `name: DB Studio Pro - .NET 10 CI/CD

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

    - name: Setup .NET SDK 10.0
      uses: actions/setup-dotnet@v3
      with:
        dotnet-version: '10.0.x'

    - name: Restore dependencies
      run: dotnet restore

    - name: Build Solution
      run: dotnet build --no-restore -c Release

    - name: Publish Artifacts
      run: dotnet publish -c Release -o ./publish
`);

  zip.file(".gitlab-ci.yml", `stages:
  - build
  - test
  - deploy

variables:
  OBJECTS_DIRECTORY: 'obj'
  NUGET_PACKAGES_FILE: '.nuget/packages'

cache:
  key: "$CI_COMMIT_REF_SLUG"
  paths:
    - obj/
    - .nuget/packages

build-dotnet:
  stage: build
  image: mcr.microsoft.com/dotnet/sdk:10.0
  script:
    - dotnet restore
    - dotnet build --no-restore -c Release
    - dotnet publish -c Release -o ./publish
  artifacts:
    paths:
      - ./publish
`);

  zip.file("deploy/ftp/ftp-deploy-instructions.md", `# FTP / SFTP Deployment fuer DB Studio Pro Backend

Da .NET 10-Anwendungen eine ausfuehrbare Runtime auf dem Zielserver benoetigen, wird die Veroeffentlichung via FTP/SFTP typischerweise fuer voruebersetzte Dateien (Self-Contained) oder im Rahmen einer CI/CD-Pipeline verwendet.

## Empfohlene Vorgehensweise:

1. **Self-Contained Release erstellen**:
   Erstellen Sie eine vollstaendige, unabhaengige Version fuer Ihr Zielbetriebssystem (z. B. Windows Server x64 oder Linux x64):
   \`\`\`bash
   dotnet publish -c Release -r win-x64 --self-contained true -o ./publish-win
   \`\`\`
   Dies packt die .NET 10 Runtime direkt in die Exe-Dateien, sodass auf dem Server kein .NET 10 vorinstalliert sein muss.

2. **FTP Upload**:
   Verbinden Sie sich mit einem FTP-Client (z. B. FileZilla, WinSCP) oder nutzen Sie ein GitHub Action FTP Deploy Plugin und laden Sie den gesamten Inhalt des Ordners \`./publish-win\` in das Zielverzeichnis hoch.

3. **Server-Konfiguration**:
   - **Windows Server (IIS)**: Konfigurieren Sie die Website mit dem "AspNetCoreModuleV2" (No Managed Code).
   - **Linux Server**: Starten Sie die Applikation als Systemd-Service und schalten Sie Nginx oder Apache als Reverse-Proxy davor.
`);

  zip.file("Dockerfile", `FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["DBStudioBackend.csproj", "./"]
RUN dotnet restore "DBStudioBackend.csproj"
COPY . .
RUN dotnet publish "DBStudioBackend.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 80
ENTRYPOINT ["dotnet", "DBStudioBackend.dll"]`);

  zip.file("docker-compose.yml", `version: '3.8'

services:
  dbstudio-backend:
    build: .
    ports:
      - "5000:80"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - GEMINI_API_KEY=\${GEMINI_API_KEY}
      - Jwt__Key=db_studio_pro_enterprise_security_key_2026
    volumes:
      - sqlite_data:/app/data
    restart: always

volumes:
  sqlite_data:
`);

  zip.file("README.md", `# DB Studio Pro - .NET 10 C# Self-Host Backend

Dieses Enterprise-Starter-Kit bietet ein robustes, sicheres und vollstaendig vorkonfiguriertes Backend fuer **DB Studio Pro** auf Basis von **.NET 10 (C#)**.

## Premium Features:

1. **Realtime Sync & Team-Chat (SignalR)**:
   - Integrierte SignalR Hubs unter \`/hubs/chat\` fuer Live-Synchronisation von Metadaten und kollaborativen Entwickler-Chat.

2. **User Authentication & Active Directory (Anmeldungen)**:
   - Sicheres JWT-Bearer Token Auth-System unter \`api/Auth/login\`.
   - Vorkonfigurierte Templates zur Synchronisation mit **Active Directory (AD / LDAP)**.

3. **Docker & Multi-Container Support**:
   - Optimiertes Multi-Stage \`Dockerfile\` und fertiges \`docker-compose.yml\` zur schnellen Bereitstellung.

4. **Infrastructure as Code (IaC)**:
   - **Azure Resource Manager / Bicep**: \`deploy/azure/deploy-azure.bicep\` fuer Azure App Services.
   - **AWS CloudFormation**: \`deploy/aws/ecs-fargate.yml\` fuer Amazon ECS auf AWS Fargate.
   - **HashiCorp Terraform**: \`deploy/terraform/main.tf\` fuer Multi-Cloud Setups.

5. **CI/CD Pipelines (GitHub & GitLab)**:
   - **GitHub Actions**: \`.github/workflows/ci-cd.yml\`
   - **GitLab CI**: \`.gitlab-ci.yml\`

6. **Webhooks & Zapier Integration**:
   - Ausloesen von Echtzeit-Ereignissen (z. B. Synchronisationen, Ticket-Erstellung) an Drittanbieter-Dienste wie Zapier via \`api/Webhooks\`.

7. **FTP/SFTP Deployment**:
   - Dokumentierte Best Practices und Skripte unter \`deploy/ftp/ftp-deploy-instructions.md\`.

## Starten des Backends:

1. Installieren Sie das **.NET 10 SDK**.
2. Starten Sie das Backend with \`dotnet run\` or \`docker-compose up --build\`.
3. Rufen Sie die interaktive Swagger API-Dokumentation unter \`http://localhost:5000/swagger\` auf.
`);
}
