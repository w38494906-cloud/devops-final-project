terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Стан зберігається в S3, щоб пайплайн бачив уже створені ресурси.
  # Назва бакета передається під час init: -backend-config="bucket=..."
  backend "s3" {
    key    = "book-catalog/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}
