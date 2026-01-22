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