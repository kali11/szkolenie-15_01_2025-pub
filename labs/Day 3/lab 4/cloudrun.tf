resource "google_cloud_run_v2_service" "apps" {
  for_each = local.cloudrunapps
  
  project  = data.google_project.project.project_id
  name     = UNIQUE_NAME_FOR_EACH_RESOURCE
  location = var.region

  deletion_protection = false

  template {
    containers {
      image = IMAGE_SHOULD_BE_TAKEN_FROM_MAP

      ports {
        container_port = PORT_SHOULD_BE_TAKEN_FROM_MAP
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

# Allow unauthenticated access to Cloud Run services created with for_each
resource "google_cloud_run_service_iam_member" "apps_public_access" {
  for_each = local.cloudrunapps
  
  project  = data.google_project.project.project_id
  service  = google_cloud_run_v2_service.apps[each.key].name
  location = google_cloud_run_v2_service.apps[each.key].location
  role     = "roles/run.invoker"
  member   = "allUsers"
}