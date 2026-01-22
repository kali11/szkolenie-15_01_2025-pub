variables {
  project_id         = "test-project"
  topic_name         = "test-topic"
  subscription_name  = ["sub1", "sub2", "sub3", "sub4"]
}

run "validate_subscription_count" {
  command = plan

  assert {
    condition     = length(output.subscription_name) == length(var.subscription_name)
    error_message = "Number of subscriptions created (${length(output.subscription_name)}) does not match the number of strings in subscription_name list (${length(var.subscription_name)})"
  }
}
