terraform {
  required_version = ">= 1.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "7.16.0"
    }
  }

  backend "gcs" {
    bucket  = "tf-state-piotr"
    prefix  = "labs"
  }
}

provider "google" {
  region = var.region
}
