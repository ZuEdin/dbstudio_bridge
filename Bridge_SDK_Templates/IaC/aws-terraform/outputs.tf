output "alb_dns_name" {
  description = "Öffentlicher DNS-Name des Application Load Balancers"
  value       = "http://${aws_lb.main.dns_name}"
}

output "ecs_cluster_name" {
  description = "Name des erstellten ECS Fargate Clusters"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Name des ECS Services"
  value       = aws_ecs_service.main.name
}

output "mysql_endpoint" {
  description = "Verbindungs-Endpunkt der MySQL-Datenbank"
  value       = var.enable_rds_mysql ? aws_db_instance.mysql[0].endpoint : "RDS deaktiviert"
}

output "mysql_address" {
  description = "Hostadresse der MySQL-Datenbank"
  value       = var.enable_rds_mysql ? aws_db_instance.mysql[0].address : "none"
}
