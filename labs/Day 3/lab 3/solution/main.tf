# Data block to reference existing project
data "google_project" "project" {
  project_id = var.project_id
}


# Cloud Run service with nginx
resource "google_cloud_run_v2_service" "nginx" {
  project  = data.google_project.project.project_id
  name     = var.cloud_run_service_name
  location = var.region

  template {
    service_account = module.iam.service_account_email

    containers {
      image = "nginx:alpine"

      ports {
        container_port = 80
      }

      resources {
        limits = {
          cpu    = "1000m"
          memory = "512Mi"
        }
      }
    }
  }
}

# Allow unauthenticated access to Cloud Run service
resource "google_cloud_run_service_iam_member" "public_access" {
  project  = data.google_project.project.project_id
  service  = google_cloud_run_v2_service.nginx.name
  location = google_cloud_run_v2_service.nginx.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

module "pubsub" {
  source = "./my-module"

  project_id         = data.google_project.project.project_id
  topic_name        = var.topic_name
  subscription_name = var.subscription_name
}

module "iam" {
  source = "./iam-module"

  project_id                  = data.google_project.project.project_id
  role_id                    = "customLabRole"
  role_title                 = "Custom Lab Role"
  service_account_id         = "lab-service-account"
  service_account_display_name = "Lab Service Account"
  service_account_description = "Service account for lab purposes"
}