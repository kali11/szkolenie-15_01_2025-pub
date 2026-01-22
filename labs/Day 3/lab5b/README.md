# Working with Dynamic blocks

1. Add new variable `env_vars` of type map. It should look like this:
```hcl
variable "env_vars" {
  type = list(object({
    key   = string
    value = string
  }))
  default     = []
  description = "List of environment variables as key-value pairs"
}
```

- you can put sample values into `terraform.tfvars` file:
```hcl
env_vars = [
  {
    key   = "ENVIRONMENT"
    value = "production"
  },
  {
    key   = "API_KEY"
    value = "your-api-key"
  }
]
```


2. Modify the Cloud Run resource (`google_cloud_run_v2_service`) to use the `env_vars` variable. Block "env" should be dynamic. (See: https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/cloud_run_v2_service#env-1)

> remember that block name is usually the iterator name


4. Confirm (eg. in GCP console) that new environment variables are created for each app.