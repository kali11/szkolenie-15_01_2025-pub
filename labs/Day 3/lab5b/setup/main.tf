# Data block to reference existing project
data "google_project" "project" {
  project_id = var.project_id
}

locals {
  cloudrunapps = { 
    "app1" = {
        "image" = "nginx:alpine"
        "port" = 80
    }
    "app2" = {
        "image" = "httpd:latest"
        "port" = 80
    }
    "app3" = {
        "image" = "prologic/todo"
        "port" = 8000
    }
}
}


# Cloud Run service with nginx
resource "google_cloud_run_v2_service" "nginx" {
  project  = data.google_project.project.project_id
  name     = "${var.cloud_run_service_name}-${terraform.workspace}"
  location = var.region

  deletion_protection = false

  template {
    scaling {
      min_instance_count = terraform.workspace == "dev" ? 0 : 1
    }

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

# Cloud Run services created using for_each based on cloudrunapps map
resource "google_cloud_run_v2_service" "apps" {
  for_each = local.cloudrunapps
  
  project  = data.google_project.project.project_id
  name     = "${each.key}-${terraform.workspace}"
  location = var.region

  deletion_protection = false

  template {
    scaling {
      min_instance_count = terraform.workspace == "dev" ? 0 : 1
    }

    containers {
      image = each.value.image

      ports {
        container_port = each.value.port
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

# resource "google_artifact_registry_repository" "cloud_run_repo" {
#   location      = "europe-west1"
#   repository_id = "piotr-registry"
#   format = "DOCKER"
# }

module "pubsub" {
  source = "./my-module"

  project_id         = data.google_project.project.project_id
  topic_name        = "${var.topic_name}-${terraform.workspace}"
  subscription_name = "${var.subscription_name}-${terraform.workspace}"
}

# GCS buckets for apps
resource "google_storage_bucket" "app_buckets" {
  count    = length(var.apps)
  name     = "piotrlab123-${var.apps[count.index]}-bucket"
  location = var.region
  project  = data.google_project.project.project_id
}