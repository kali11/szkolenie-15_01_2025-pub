# Pub/Sub Topic
resource "google_pubsub_topic" "topic" {
  project = PROJECT_ID
  name    = TOPIC_NAME
}

# Pub/Sub Subscription
resource "google_pubsub_subscription" "subscription" {
  project = PROJECT_ID
  name    = SUBSCRIPTION_NAMEe

  # Subscription settings
  ack_deadline_seconds       = 10
  retain_acked_messages      = false
  message_retention_duration = "604800s" # 7 days

  # Delivery settings
  enable_message_ordering = false

  # Retry policy
  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }
}
