output "cloud_run_service_url" {
  description = "The URL of the Cloud Run service"
  value       = google_cloud_run_v2_service.nginx.uri
}

output "cloud_run_service_name" {
  description = "The name of the Cloud Run service"
  value       = google_cloud_run_v2_service.nginx.name
}

output "topic_name" {
  description = "The name of the Pub/Sub topic"
  value       = module.pubsub.topic_name
}

output "subscription_name" {
  description = "The name of the Pub/Sub subscription"
  value       = module.pubsub.subscription_name
}