output "instance_ip" {
  description = "Публічний IP сервера"
  value       = aws_instance.app.public_ip
}

output "app_url" {
  description = "Адреса застосунку"
  value       = "http://${aws_instance.app.public_ip}"
}
