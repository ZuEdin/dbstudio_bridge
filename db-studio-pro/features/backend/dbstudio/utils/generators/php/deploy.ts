import JSZip from "jszip";

export function generateDeployFiles(zip: JSZip) {
  zip.file("deploy/azure/deploy-azure-php.json", `{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "webAppName": { "type": "string", "defaultValue": "dbstudio-pro-php" },
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
          "linuxFxVersion": "PHP|8.2",
          "appSettings": [
            { "name": "APP_ENV", "value": "production" },
            { "name": "APP_DEBUG", "value": "false" }
          ]
        }
      }
    }
  ]
}`);

  zip.file("deploy/aws/ecs-fargate-php.yml", `AWSTemplateFormatVersion: '2010-09-09'
Description: AWS CloudFormation Template fuer DB Studio Pro PHP Backend auf Fargate.
Resources:
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: DBStudioPHPCluster

  LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /ecs/dbstudio-php

  TaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: dbstudio-php
      Cpu: '256'
      Memory: '512'
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      ContainerDefinitions:
        - Name: dbstudio-php
          Image: php:8.2-apache
          PortMappings:
            - ContainerPort: 80
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
  name = "dbstudio-php-cluster"
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "dbstudio-php-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"

  container_definitions = jsonencode([
    {
      name      = "php-backend"
      image     = "dbstudio-php:latest"
      essential = true
      portMappings = [
        {
          containerPort = 80
          hostPort      = 80
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

  zip.file(".github/workflows/ci-cd.yml", `name: DB Studio Pro - PHP CI/CD

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

    - name: Setup PHP
      uses: shivammathur/setup-php@v2
      with:
        php-version: '8.2'
        extensions: mbstring, xml, ctype, iconv, sqlite3

    - name: Install dependencies
      run: composer install --no-progress --no-suggest --prefer-dist

    - name: Run Tests
      run: php artisan test --pass-on-empty
`);

  zip.file(".gitlab-ci.yml", `stages:
  - build
  - test

cache:
  key: "$CI_COMMIT_REF_SLUG"
  paths:
    - vendor/

build-php:
  stage: build
  image: php:8.2
  script:
    - apt-get update && apt-get install -y unzip sqlite3 libsqlite3-dev
    - curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
    - composer install --no-dev --optimize-autoloader
  artifacts:
    paths:
      - vendor/
`);

  zip.file("deploy/ftp/ftp-deploy-instructions.md", `# FTP / SFTP Deployment fuer DB Studio Pro PHP Backend

PHP-Anwendungen lassen sich sehr einfach per FTP oder SFTP auf klassischem Webhosting (z.B. Strato, 1&1, Ionos, Hostinger) bereitstellen.

## Vorgehensweise:

1. **Lokaler Vorbereitungsschritt**:
   Installieren Sie alle Abhängigkeiten lokal für den Produktivbetrieb:
   \`\`\`bash
   composer install --no-dev --optimize-autoloader
   \`\`\`

2. **FTP Upload**:
   - Laden Sie den gesamten Projektordner (einschließlich des \`vendor\`-Ordners) auf Ihren FTP-Server hoch.
   - Stellen Sie sicher, dass das Document Root Ihres Webservers auf den Unterordner \`public/\` verweist, um unberechtigten Zugriff auf Quellcode und SQLite-Dateien zu verhindern.

3. **Rechtevergabe**:
   Stellen Sie sicher, dass der Webserver-Prozess (z.B. \`www-data\`) Schreibrechte auf folgende Verzeichnisse besitzt:
   - \`storage/\` (für Caching und Logs)
   - \`/app/dbstudio_meta.db\` (für SQLite Zugriffe)
`);

  zip.file("Dockerfile", `FROM php:8.2-apache

# Install SQLite dependency
RUN apt-get update && apt-get install -y sqlite3 libsqlite3-dev zip unzip git \\
    && docker-php-ext-install pdo pdo_mysql

# Enable Apache ModRewrite
RUN a2enmod rewrite

# Setup Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Setup Working Dir
WORKDIR /var/www/html

# Copy Project Code
COPY . .

# Run Composer Install
RUN composer install --no-dev --optimize-autoloader

# Set permissions
RUN chown -r www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 80
`);

  zip.file("docker-compose.yml", `version: '3.8'

services:
  dbstudio-php:
    build: .
    ports:
      - "8000:80"
    environment:
      - APP_ENV=local
      - APP_DEBUG=true
      - GEMINI_API_KEY=\${GEMINI_API_KEY}
    volumes:
      - sqlite_data:/var/www/html/database
    restart: always

volumes:
  sqlite_data:
`);

  zip.file("README.md", `# DB Studio Pro - PHP Laravel Self-Host Backend

Dieses Enterprise-Starter-Kit bietet ein robustes, sicheres und vollstaendig vorkonfiguriertes PHP Laravel Backend fuer **DB Studio Pro**.

## Features:

1. **Local Authentication & Role Assignments**:
   - Sicheres Login- und Registrierungs-System unter \`api/auth/login\` und \`api/auth/register\`.
   - Volle Rollenzuweisungen und Benutzerverwaltung ohne Active Directory Bindung.

2. **Docker & Multi-Container Support**:
   - \`Dockerfile\` und \`docker-compose.yml\` zur schnellen Bereitstellung.

3. **Infrastructure as Code (IaC)**:
   - **Azure Resource Manager**: \`deploy/azure/deploy-azure-php.json\`.
   - **AWS CloudFormation**: \`deploy/aws/ecs-fargate-php.yml\`.
   - **HashiCorp Terraform**: \`deploy/terraform/main.tf\`.

4. **CI/CD Pipelines**:
   - **GitHub Actions**: \`.github/workflows/ci-cd.yml\`
   - **GitLab CI**: \`.gitlab-ci.yml\`

5. **Simulated SMTP Outbox & Webhooks**:
   - Protokolliertes E-Mail Versandsystem und Zapier Hooks unter \`api/webhooks\`.

## Starten des Backends:

1. Installieren Sie **PHP 8.2** oder neuer und **Composer**.
2. Führen Sie \`composer install\` aus.
3. Starten Sie das Backend mit \`php artisan serve\` oder \`docker-compose up --build\`.
`);
}
