# Custom IAM Role
resource "google_project_iam_custom_role" "custom_role" {
  project     = var.project_id
  role_id     = var.role_id
  title       = var.role_title
  description = "Custom role created by Terraform module"
  permissions = [
    "storage.objects.get",
    "storage.objects.list",
    "storage.buckets.get",
    "storage.buckets.list",
    "compute.instances.get",
    "compute.instances.list",
    "logging.logEntries.create",
    "monitoring.timeSeries.list"
  ]
}

# Service Account
resource "google_service_account" "service_account" {
  project      = var.project_id
  account_id   = var.service_account_id
  display_name = var.service_account_display_name != "" ? var.service_account_display_name : var.service_account_id
  description  = var.service_account_description != "" ? var.service_account_description : "Service account created by Terraform module"
}

# Assign custom role to service account
resource "google_project_iam_member" "role_assignment" {
  project = var.project_id
  role    = google_project_iam_custom_role.custom_role.name
  member  = "serviceAccount:${google_service_account.service_account.email}"
}
