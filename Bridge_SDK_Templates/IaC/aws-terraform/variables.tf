variable "aws_region" {
  description = "Die AWS-Zielregion für das Deployment"
  type        = string
  default     = "eu-central-1"
}

variable "environment" {
  description = "Umgebungsbezeichnung (z. B. dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Projektname für Ressourcen-Präfixe und Tags"
  type        = string
  default     = "dbstudio-app"
}

variable "vpc_cidr" {
  description = "CIDR-Block für das Virtual Private Cloud (VPC) Netzwerk"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Liste der Verfügbarkeitszonen für Hochverfügbarkeit"
  type        = list(string)
  default     = ["eu-central-1a", "eu-central-1b"]
}

variable "public_subnet_cidrs" {
  description = "CIDR-Blöcke für öffentliche Subnetze (ALB)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR-Blöcke für private Subnetze (ECS Fargate & RDS)"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

# Container & ECS Konfiguration
variable "container_image" {
  description = "Docker Image URI (z. B. ECR Repository oder Docker Hub)"
  type        = string
  default     = "nginx:alpine"
}

variable "container_port" {
  description = "Port, auf dem der Container im Container-Netzwerk lauscht"
  type        = number
  default     = 5000
}

variable "app_cpu" {
  description = "Fargate CPU Einheiten (256 = 0.25 vCPU, 512 = 0.5 vCPU, 1024 = 1 vCPU)"
  type        = number
  default     = 512
}

variable "app_memory" {
  description = "Fargate Arbeitsspeicher in MB (1024 = 1 GB, 2048 = 2 GB)"
  type        = number
  default     = 1024
}

variable "desired_count" {
  description = "Anzahl der gleichzeitig laufenden Fargate Tasks"
  type        = number
  default     = 2
}

# Datenbank Konfiguration (Amazon RDS MySQL)
variable "enable_rds_mysql" {
  description = "Aktiviert eine verwaltete Amazon RDS MySQL Instanz"
  type        = bool
  default     = true
}

variable "db_instance_class" {
  description = "RDS Instanztyp (z. B. db.t4g.micro für Dev, db.m6g.large für Prod)"
  type        = string
  default     = "db.t4g.micro"
}

variable "db_name" {
  description = "Name der MySQL Standard-Datenbank"
  type        = string
  default     = "app_db"
}

variable "db_username" {
  description = "Administrator-Benutzername für die MySQL-Datenbank"
  type        = string
  default     = "dbadmin"
}

variable "db_password" {
  description = "Passwort für die MySQL-Datenbank"
  type        = string
  sensitive   = true
  default     = "ChangeMeInProduction2026!"
}
