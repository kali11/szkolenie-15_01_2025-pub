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

variable "app_configs" {
  description = "App configurations with optional environment variables"
  type = map(object({
    image = string
    port  = number
    # Optional: environment variables as a map
    env_vars = optional(map(string))
    # Optional: secret environment variables as a map
    secret_env_vars = optional(map(string))
  }))
  default = {
    "app1" = {
      image = "nginx:alpine"
      port  = 80
      env_vars = {
        "ENVIRONMENT" = "production"
        "LOG_LEVEL"    = "info"
      }
    }
    "app2" = {
      image = "httpd:latest"
      port  = 80
      # No env_vars - dynamic block won't be created
    }
    "app3" = {
      image = "prologic/todo"
      port  = 8000
      env_vars = {
        "DATABASE_URL" = "postgres://localhost/todo"
      }
    }
  }
}
