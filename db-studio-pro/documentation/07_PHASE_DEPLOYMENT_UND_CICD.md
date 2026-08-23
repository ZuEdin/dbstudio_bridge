# Phase 7: Automatisches Deployment & CI/CD Pipeline Generator

Wenn Firmen-Apps generiert werden, müssen sie nahtlos im Unternehmensnetzwerk oder in der Cloud ausgerollt werden. DB Studio Pro erstellt nicht nur den Code, sondern auch die exakten Bereitstellungspläne.

## 7.1 Docker & Kubernetes Generator
- [x] **Die Idee**: Jede generierte App (Frontend/Backend) sollte sofort container-ready sein.
- [x] **Features**: Benutzer wählen aus "Docker Compose" oder "Kubernetes (Helm Charts)".
- [x] **Die Generierung**: Erzeugung extrem isolierter und auf Sicherheit optimierter `Dockerfile` für React (NGINX Alpine) und das jeweilige Backend (.NET 8, Node.js), sowie `.yaml` files für das Deployment.

## 7.2 GitHub Actions & Azure DevOps Pipelines
- [x] **Die Idee**: Automatisierter Build & Rollout der App per Knopfdruck bei zukünftigen Änderungen.
- [x] **Features**: DB Studio Pro integriert CI/CD Vorlagen im Generator, mit denen die Codebasis direkt z.B. auf AWS gepusht werden kann.
- [x] **Die Generierung**: `.github/workflows/deploy.yml` oder `azure-pipelines.yml`, vorkonfiguriert mit Linting, Unit-Testing (falls gewünscht) und Deployment.

## 7.3 Infrastructure as Code (Terraform / Bicep)
- [x] **Die Idee**: Ganze Cloud-Umgebungen (inklusive SQL-Server, App Service) bei Bedarf automatisiert erzeugen lassen.
- [x] **Features**: Auswahl von Cloud-Providern (AWS, Azure, Google Cloud).
- [x] **Die Generierung**: Generierung von Terraform-Scripten (`main.tf`), welche die gesamte Architektur der per App definierten Tabellen und Berechtigungen abbilden können.
