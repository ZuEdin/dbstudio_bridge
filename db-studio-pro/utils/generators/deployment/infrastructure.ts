import { BackendConfig, VirtualFile } from '../../../types/index';

export const generateInfrastructureFiles = (config: BackendConfig, root: string, target: string): VirtualFile[] => {
    const files: VirtualFile[] = [];
    const tfMain = `# Terraform Configuration for App Infrastructure
# Configured for PostgreSQL Server and Container App Hosting

terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC Configuration
resource "aws_vpc" "app_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags = {
    Name = "\${var.project_name}-vpc"
  }
}

# Subnets & Networking
resource "aws_subnet" "public_subnet" {
  vpc_id                  = aws_vpc.app_vpc.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "\${var.aws_region}a"
}

# PostgreSQL Database Instance
resource "aws_db_instance" "postgres" {
  allocated_storage    = 20
  engine               = "postgres"
  engine_version       = "15"
  instance_class       = "db.t4g.micro"
  db_name              = replace(var.project_name, "-", "_")
  username             = "db_admin"
  password             = var.db_password
  skip_final_snapshot  = true
  publicly_accessible  = false
}

# ECS or App Hosted Service
resource "aws_apprunner_service" "app_service" {
  service_name = "\${var.project_name}-app"

  source_configuration {
    image_repository {
      image_identifier      = "\${var.docker_image_name}:latest"
      image_repository_type = "ECR"
      image_configuration {
        port = var.container_port
      }
    }
    auto_deployments_enabled = true
  }
}
`;

    const tfVars = `variable "aws_region" {
  type        = string
  default     = "eu-central-1"
  description = "Region to deploy resources into"
}

variable "project_name" {
  type        = string
  default     = "${config.projectName.toLowerCase()}"
  description = "Name of the project"
}

variable "db_password" {
  type        = string
  sensitive   = true
  description = "Password of the Postgres Database"
}

variable "docker_image_name" {
  type        = string
  default     = "${config.projectName.toLowerCase()}-app"
  description = "The docker image to deploy"
}

variable "container_port" {
  type        = number
  default     = ${config.port || 3000}
  description = "Direct ingress port"
}
`;

    const bicepMain = `// Azure Bicep Template for App Infrastructure
param projectName string = '${config.projectName.toLowerCase()}'
param location string = resourceGroup().location
param sqlAdminLogin string = 'sqladmin'
@secure()
param sqlAdminPassword string

resource appServicePlan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: '\${projectName}-asp'
  location: location
  sku: {
    name: 'F1'
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

resource webApp 'Microsoft.Web/sites@2022-03-01' = {
  name: '\${projectName}-app'
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'DOCKER|nginx:alpine'
    }
  }
}

resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2022-12-01' = {
  name: '\${projectName}-postgres'
  location: location
  sku: {
    name: 'Standard_D2s_v3'
    tier: 'GeneralPurpose'
  }
  properties: {
    administratorLogin: sqlAdminLogin
    administratorLoginPassword: sqlAdminPassword
    version: '15'
    storage: {
      storageSizeGB: 32
    }
  }
}
`;

    if (target === 'aws' || target === 'azure') {
        files.push({
            name: 'main.tf',
            path: `${root}/infrastructure/terraform/main.tf`,
            content: tfMain,
            language: 'hcl'
        });

        files.push({
            name: 'variables.tf',
            path: `${root}/infrastructure/terraform/variables.tf`,
            content: tfVars,
            language: 'hcl'
        });
    }

    if (target === 'azure') {
        files.push({
            name: 'main.bicep',
            path: `${root}/infrastructure/bicep/main.bicep`,
            content: bicepMain,
            language: 'bicep'
        });
    }
    return files;
};
