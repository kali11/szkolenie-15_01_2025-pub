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

resource "google_artifact_registry_repository" "cloud_run_repo" {
  location      = "europe-west1"
  repository_id = "piotr-registry"
  format = "DOCKER"
}

module "pubsub" {
  source = "./my-module"

  project_id         = data.google_project.project.project_id
  topic_name        = var.topic_name
  subscription_name = var.subscription_name
}