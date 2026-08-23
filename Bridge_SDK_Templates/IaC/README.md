# Infrastructure as Code (IaC) Templates für DB Studio & Bridge

Dieses Verzeichnis enthält sofort einsatzbereite, produktionsreife **Infrastructure as Code (IaC)** Templates für das Cloud-Deployment generierter Container-Applikationen (.NET, PHP, Node.js) und Datenbanken (MySQL) auf **AWS** und **Microsoft Azure**.

---

## 1. AWS Terraform (`aws-terraform/`)

### Enthaltene Ressourcen:
- **Netzwerk:** VPC mit öffentlichen & privaten Subnetzen über mehrere Verfügbarkeitszonen, Internet Gateway und Route Tables.
- **Sicherheit:** Fein granulierte Security Groups (ALB -> ECS Fargate -> Amazon RDS MySQL Port 3306).
- **Datenbank:** Amazon RDS MySQL 8.0 Instanz in privaten Subnetzen mit Multi-AZ Unterstützung.
- **Container Laufzeit:** Amazon ECS Cluster mit AWS Fargate Tasks (Serverless Container), IAM Execution Roles und CloudWatch Log Group.
- **Load Balancing:** Application Load Balancer (ALB) mit Health-Check Target Group und Listener auf Port 80.

### Deployment-Befehle:
```bash
cd aws-terraform

# 1. Initialisieren
terraform init

# 2. Plan anzeigen
terraform plan -var="container_image=123456789.dkr.ecr.eu-central-1.amazonaws.com/myapp:latest"

# 3. Infrastruktur ausrollen
terraform apply -auto-approve
```

---

## 2. Azure Bicep (`azure-bicep/`)

### Enthaltene Ressourcen:
- **Monitoring:** Log Analytics Workspace für zentrales Logging und Metriken.
- **Container Laufzeit:** Azure Container Apps Managed Environment mit Autoscaling (Scale-to-Zero oder 1–5 Replikate).
- **Ingress & TLS:** Automatisches HTTPS mit öffentlichem FQDN über Azure Container Apps Ingress.
- **Datenbank:** Azure Database for MySQL Flexible Server (Burstable B1ms) mit interner Azure-Firewall-Regel und UTF8mb4 Standard-Datenbank.
- **Secrets Management:** Verschlüsselte DB-Passwörter in Container App Secrets.

### Deployment-Befehle:
```bash
cd azure-bicep

# 1. Resource Group erstellen
az group create --name rg-dbstudio-prod --location westeurope

# 2. Bicep Template ausführen
az deployment group create \
  --resource-group rg-dbstudio-prod \
  --template-file main.bicep \
  --parameters @parameters.json
```
