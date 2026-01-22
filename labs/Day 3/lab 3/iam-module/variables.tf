variable "project_id" {
  description = "The GCP project ID where the IAM resources will be created"
  type        = string
}

variable "role_id" {
  description = "The ID of the custom role (e.g., 'customRole')"
  type        = string
}

variable "role_title" {
  description = "The title of the custom role"
  type        = string
}

variable "service_account_id" {
  description = "The ID of the service account"
  type        = string
}

variable "service_account_display_name" {
  description = "The display name of the service account"
  type        = string
  default     = ""
}

variable "service_account_description" {
  description = "The description of the service account"
  type        = string
  default     = ""
}
