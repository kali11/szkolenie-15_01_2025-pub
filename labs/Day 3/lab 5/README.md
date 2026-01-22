# Working with Dynamic blocks

1. Add new variable `app_configs` of type map. It should look like this:
```hcl
variable "app_configs" {
  description = "App configurations with optional environment variables"
  type = map(object({
    image = string
    port  = number
    # Optional: environment variables as a map
    env_vars = optional(map(string))
  }))
  default = {
    "app1" = {
      image = "nginx:alpine"
      port  = 80
      env_vars = {
        "ENVIRONMENT" = "production"
        "LOG_LEVEL"    = "info"
      }
    }
    "app2" = {
      image = "httpd:latest"
      port  = 80
      # No env_vars - dynamic block won't be created
    }
    "app3" = {
      image = "prologic/todo"
      port  = 8000
      env_vars = {
        "DATABASE_URL" = "postgres://localhost/todo"
      }
    }
  }
}
```

2. Create a new local variable `app_configs_safe` of type map. It should look like this:
```hcl
locals {
  app_configs_safe = {
    for app_name, app_config in var.app_configs : app_name => {
      image          = app_config.image
      port           = app_config.port
      env_vars       = app_config.env_vars != null ? app_config.env_vars : {}
      secret_env_vars = app_config.secret_env_vars != null ? app_config.secret_env_vars : {}
    }
  }
}
```

3. Modify the Cloud Run resource to use the `app_configs_safe` variable. Block "env" should be dynamic. (See: https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/cloud_run_v2_service#env-1)

> Remember to modify `for_each` attribute to use `app_configs_safe` variable.

4. Confirm (eg. in GCP console) that new environment variables are created for each app.