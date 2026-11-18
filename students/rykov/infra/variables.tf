variable "aws_region" {
  description = "Регіон AWS"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Префікс для назв ресурсів"
  type        = string
  default     = "book-catalog"
}

variable "instance_type" {
  description = "Тип інстансу EC2"
  type        = string
  default     = "t2.micro"
}

variable "public_key" {
  description = "Публічний SSH-ключ для доступу до EC2"
  type        = string
}

variable "ssh_cidr" {
  description = "З яких адрес дозволено SSH"
  type        = string
  default     = "0.0.0.0/0"
}
