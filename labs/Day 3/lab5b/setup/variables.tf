variable "project_id" {
  description = "The GCP project ID (must already exist)"
  type        = string
}

variable "region" {
  description = "The GCP region"
  type        = string
  default     = "europe-west1"
}

variable "cloud_run_service_name" {
  description = "The name of the Cloud Run service"
  type        = string
  default     = "nginx-service"
}

variable "topic_name" {
  description = "Name of the Pub/Sub topic"
  type        = string
  default     = "lab1-topic"
}

variable "subscription_name" {
  description = "Name of the Pub/Sub subscription"
  type        = string
  default     = "lab1-subscription"
}

variable "apps" {
  description = "List of application names"
  type        = list(string)
  default     = ["app1", "app2", "app3"]
}
