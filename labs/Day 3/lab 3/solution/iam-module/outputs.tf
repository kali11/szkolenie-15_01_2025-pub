output "custom_role_id" {
  description = "The ID of the custom role"
  value       = google_project_iam_custom_role.custom_role.role_id
}

output "custom_role_name" {
  description = "The full name of the custom role"
  value       = google_project_iam_custom_role.custom_role.name
}

output "service_account_email" {
  description = "The email address of the service account"
  value       = google_service_account.service_account.email
}

output "service_account_id" {
  description = "The ID of the service account"
  value       = google_service_account.service_account.id
}

output "service_account_name" {
  description = "The fully qualified name of the service account"
  value       = google_service_account.service_account.name
}
