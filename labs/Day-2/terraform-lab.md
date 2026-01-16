# Terraform Basics with Google Cloud Run Workshop

## Workshop Overview

In this practical workshop, you will learn Terraform fundamentals by building and deploying a **Google Cloud Run service** from scratch. You'll understand how Infrastructure as Code works, manage Terraform state, define variables and outputs, and experience the complete plan/apply workflow.

### Learning Objectives

By the end of this workshop, you will be able to:
- Understand Infrastructure as Code (IaC) principles and benefits
- Write declarative Terraform configuration files
- Define and manage variables and outputs
- Understand resource interdependencies (implicit and explicit)
- Work with Terraform state files and state management
- Execute the plan/apply workflow safely and predictably
- Deploy a containerized application to Google Cloud Run using Terraform

### Prerequisites

- Access to a Google Cloud Platform project with Cloud Run API enabled
- Terraform installed locally (version 1.0 or higher)
- Google Cloud SDK (`gcloud`) installed and configured
- Basic familiarity with command-line interface
- A code editor (VS Code recommended)

---

## Task 1: Set Up Terraform Project and Configure the Google Provider

### Overview
Initialize your Terraform project with the proper directory structure and configure authentication to Google Cloud Platform.

### Step-by-Step Instructions

1. **Create a project directory for Terraform:**
   ```bash
   mkdir terraform-cloudrun-workshop
   cd terraform-cloudrun-workshop
   ```

2. **Create the required Terraform files:**
   ```bash
   touch main.tf providers.tf variables.tf outputs.tf
   ```
   
   Your project structure should look like:
   ```
   terraform-cloudrun-workshop/
   ├── main.tf
   ├── providers.tf
   ├── variables.tf
   ├── outputs.tf
   └── terraform.tfstate (created later after apply)
   ```

3. **Configure the Google provider in `providers.tf`:**
   ```hcl
   terraform {
     required_version = ">= 1.0"
     required_providers {
       google = {
         source  = "hashicorp/google"
         version = "~> 5.0"
       }
     }
   }

   provider "google" {
     project = var.project_id
     region  = var.region
   }
   ```

4. **Define variables in `variables.tf`:**
   ```hcl
   variable "project_id" {
     description = "The GCP project ID"
     type        = string
   }

   variable "region" {
     description = "The GCP region for resources"
     type        = string
     default     = "europe-west1"
   }

   variable "service_name" {
     description = "The name of the Cloud Run service"
     type        = string
     default     = "terraform-workshop-service"
   }

   variable "container_image" {
     description = "The container image to deploy"
     type        = string
     default     = "us-docker.pkg.dev/cloudrun/container/hello"
   }

   variable "min_instances" {
     description = "Minimum number of instances to keep warm"
     type        = number
     default     = 0
   }
   ```

5. **Initialize the Terraform working directory:**
   ```bash
   terraform init
   ```
   
   This command:
   - Downloads the Google provider plugin
   - Creates the `.terraform` directory with provider binaries
   - Creates a lock file (`.terraform.lock.hcl`) for reproducible builds
   - Prepares your directory for Terraform operations

6. **Verify the initialization:**
   ```bash
   ls -la
   ```
   
   You should see `.terraform` directory and `.terraform.lock.hcl` file created.

### Key Concepts

- **Provider:** A plugin that enables Terraform to interact with specific cloud platforms (Google Cloud in this case)
- **Required Providers:** Declares which providers your configuration needs and their versions
- **terraform init:** Initializes a Terraform working directory, downloading necessary provider plugins
- **Lock File:** Ensures consistent provider versions across team members and environments
- **Variable Declaration:** `variables.tf` defines input variables that make configurations reusable and flexible

---

## Task 2: Declare Cloud Run Service Resource and Understand Dependencies

### Overview
Create your first Terraform resource—a Google Cloud Run service—and understand how Terraform manages resource relationships.

### Step-by-Step Instructions

1. **Add the Cloud Run service resource to `main.tf`:**
   ```hcl
   resource "google_cloud_run_v2_service" "app" {
     name     = var.service_name
     location = var.region

     deletion_protection = false

     template {
       containers {
         image = var.container_image
       }

       scaling {
         min_instance_count = var.min_instances
         max_instance_count = 10
       }
     }
   }
   ```

   This resource declaration defines:
   - **name:** The Cloud Run service name (references variable)
   - **location:** The GCP region for deployment
   - **template.containers.image:** The Docker container image to run
   - **template.scaling:** Auto-scaling configuration

2. **Add Cloud Run IAM policy for public access in `main.tf`:**
   ```hcl
   resource "google_cloud_run_service_iam_member" "public_access" {
     service            = google_cloud_run_v2_service.app.name
     location           = google_cloud_run_v2_service.app.location
     role               = "roles/run.invoker"
     member             = "allUsers"
   }
   ```

   This resource:
   - **Creates an implicit dependency** on the Cloud Run service (via `google_cloud_run_v2_service.app.name`)
   - Grants public access to anyone (`allUsers`) to invoke the service
   - Must be created after the service exists

3. **Understand resource interdependencies:**

   **Implicit Dependencies (Automatic):**
   - When a resource references another resource's attribute using interpolation, Terraform automatically detects the dependency
   - Example: `service = google_cloud_run_v2_service.app.name` creates an implicit dependency
   - Terraform builds a dependency graph and creates resources in the correct order

   **Explicit Dependencies (Manual):**
   - Use `depends_on` when dependencies aren't obvious from the configuration
   - Example use case: An application on EC2 needs an S3 bucket, but the configuration doesn't reference the bucket
   ```hcl
   resource "example_resource" "example" {
     depends_on = [google_cloud_run_v2_service.app]
   }
   ```

4. **View the dependency graph (preview):**
   ```bash
   terraform graph
   ```
   
   This generates a dependency graph in DOT format showing resource relationships (you'll use this later).

5. **Validate your configuration syntax:**
   ```bash
   terraform validate
   ```
   
   This checks for syntax errors and basic configuration issues without creating resources.

### Key Concepts

- **Resource Declaration:** Defines infrastructure components using `resource "type" "name"` syntax
- **Resource Interpolation:** `${resource_type.resource_name.attribute}` or `resource_type.resource_name.attribute` references other resources
- **Implicit Dependencies:** Terraform automatically detects dependencies through resource references
- **Explicit Dependencies:** The `depends_on` argument manually declares dependencies when needed
- **Dependency Graph:** Terraform's internal representation of resource creation order

---

## Task 3: Define Outputs and Export Resource Information

### Overview
Create output values that expose important resource information (like the Cloud Run service URL) for users and downstream systems.

### Step-by-Step Instructions

1. **Add outputs to `outputs.tf`:**
   ```hcl
   output "service_name" {
     description = "The name of the Cloud Run service"
     value       = google_cloud_run_v2_service.app.name
   }

   output "service_url" {
     description = "The URL of the Cloud Run service"
     value       = google_cloud_run_v2_service.app.status[0].url
   }

   output "service_location" {
     description = "The location/region of the Cloud Run service"
     value       = google_cloud_run_v2_service.app.location
   }

   output "service_id" {
     description = "The unique identifier of the Cloud Run service"
     value       = google_cloud_run_v2_service.app.id
   }
   ```

   Each output includes:
   - **description:** Explains what the output represents
   - **value:** The actual value to export (can reference resources)

2. **Create a complex output that combines information:**
   ```hcl
   output "deployment_info" {
     description = "Summary of the deployed service"
     value = {
       name     = google_cloud_run_v2_service.app.name
       url      = google_cloud_run_v2_service.app.status[0].url
       region   = var.region
       project  = var.project_id
       image    = var.container_image
     }
   }
   ```

### Key Concepts

- **Outputs:** Export data from Terraform for use by users, other modules, or systems
- **Output Values:** Can reference resource attributes, variables, or computed values
- **Output Attributes:** Include `description`, `value`, and optionally `sensitive` (for passwords/keys)
- **Sensitive Outputs:** Use `sensitive = true` to redact values from logs (important for secrets)
- **Output Visibility:** After `terraform apply`, outputs are displayed and can be queried with `terraform output`

---

## Task 4: Understand and Manage Terraform State

### Overview
Learn how Terraform tracks your infrastructure through state files and understand state management best practices.

### Step-by-Step Instructions

1. **Set variables for deployment:**
   
   Create a file called `terraform.tfvars`:
   ```hcl
   project_id  = "YOUR_GCP_PROJECT_ID"
   region      = "europe-west1"
   service_name = "terraform-workshop-service"
   ```
   
   Replace `YOUR_GCP_PROJECT_ID` with your actual GCP project ID.

2. **Run terraform plan to see what will be created:**
   ```bash
   terraform plan -var-file=terraform.tfvars
   ```
   
   This command:
   - **Does NOT create resources**
   - Shows a preview of what Terraform will do
   - Compares desired configuration (your `.tf` files) with actual infrastructure state
   - Displays all planned changes with `+` for additions, `~` for modifications, `-` for deletions

   Examine the output carefully. You should see:
   - `+ google_cloud_run_v2_service.app` (will be created)
   - `+ google_cloud_run_service_iam_member.public_access` (will be created)

3. **Understand the state file (before apply):**
   
   Before running `apply`, no state file exists locally. When you run `apply`, Terraform will:
   - Create resources on GCP
   - Create `terraform.tfstate` file containing a JSON snapshot of created resources
   - Track resource IDs, attributes, and metadata

4. **Apply the configuration:**
   ```bash
   terraform apply -var-file=terraform.tfvars
   ```
   
   When prompted, type `yes` to confirm. This command:
   - Executes the plan
   - Creates resources on GCP
   - **Creates `terraform.tfstate`** file locally (contains sensitive information!)
   - Creates `terraform.tfstate.backup` (previous state backup)

5. **Examine the state file (after apply):**
   ```bash
   cat terraform.tfstate | jq .
   ```
   
   Or view it as plain text:
   ```bash
   cat terraform.tfstate
   ```
   
   The state file contains:
   - **version:** Terraform version used
   - **resources:** All managed resources with their current attributes
   - **outputs:** Computed output values
   - **metadata:** Dependencies, resource IDs, and attributes

6. **List resources in state:**
   ```bash
   terraform state list
   ```
   
   Output should show:
   ```
   google_cloud_run_v2_service.app
   google_cloud_run_service_iam_member.public_access
   ```

7. **Show details of a specific resource in state:**
   ```bash
   terraform state show google_cloud_run_v2_service.app
   ```
   
   This displays all attributes of the Cloud Run service that Terraform is tracking.

8. **View computed outputs:**
   ```bash
   terraform output
   ```
   
   This displays all outputs defined in `outputs.tf`. You can also query specific outputs:
   ```bash
   terraform output service_url
   terraform output deployment_info
   ```

### Key Concepts

- **Terraform State:** A JSON file mapping your configuration to real infrastructure resources
- **State Purpose:** Tracks resource IDs, attributes, and metadata; enables detecting changes
- **terraform.tfstate:** Default local state file (contains sensitive data—protect it!)
- **terraform.tfstate.backup:** Previous state backup (created before modifications)
- **State Locking:** Prevents concurrent modifications (important for team environments; use remote backends)
- **Remote State:** Store state in cloud backends (S3, GCS, Terraform Cloud) for team collaboration
- **State Commands:**
  - `terraform state list` — List all resources in state
  - `terraform state show <resource>` — Show resource details
  - `terraform state rm <resource>` — Remove resource from state
  - `terraform state mv <source> <dest>` — Rename/move resources in state
  - `terraform state pull` — Download state from remote backend
  - `terraform state push` — Upload state to remote backend

---

## Task 5: Modify Configuration and Execute Plan/Apply Workflow

### Overview
Update your Terraform configuration and understand how the plan/apply workflow detects and applies changes safely.

### Step-by-Step Instructions

1. **Modify the Cloud Run service configuration:**
   
   Update `main.tf` to add a min_instances value:
   ```hcl
   resource "google_cloud_run_v2_service" "app" {
     name     = var.service_name
     location = var.region

     deletion_protection = false

     template {
       containers {
         image = var.container_image
       }

       scaling {
         min_instance_count = 1  # Changed from 0 to 1
         max_instance_count = 10
       }
     }
   }
   ```

2. **Run terraform plan to preview changes:**
   ```bash
   terraform plan -var-file=terraform.tfvars
   ```
   
   Observe the output:
   - **~** indicates the resource will be modified
   - Shows the specific attribute change: `min_instance_count: "0" -> "1"`
   - **No resources are created or destroyed**—only modified

3. **Apply the changes:**
   ```bash
   terraform apply -var-file=terraform.tfvars
   ```
   
   Type `yes` to confirm. The service will be updated on GCP.

4. **Verify the state file was updated:**
   ```bash
   terraform state show google_cloud_run_v2_service.app | grep min_instance
   ```
   
   The state file now reflects `min_instance_count = 1`.

5. **Add a variable override to test flexibility:**
   ```bash
   terraform plan -var-file=terraform.tfvars -var="service_name=workshop-service-v2"
   ```
   
   This shows how changing variables through CLI flags affects the plan without modifying files.

### Key Concepts

- **terraform plan:** Safe preview of infrastructure changes
- **Plan Output:** Shows additions (+), modifications (~), and deletions (-)
- **Change Verification:** Review plans before applying in production environments
- **State Synchronization:** The state file is updated during `terraform apply`
- **Variable Precedence:** CLI variables override tfvars file variables
- **Idempotency:** Running `apply` multiple times with same configuration creates no changes

---

## Task 6: Clean Up and Destroy Resources

### Overview
Properly destroy infrastructure using Terraform to avoid unexpected cloud costs.

### Step-by-Step Instructions

1. **Preview what will be destroyed:**
   ```bash
   terraform plan -destroy -var-file=terraform.tfvars
   ```
   
   This shows all resources marked with `-` that will be deleted.

2. **Destroy all resources:**
   ```bash
   terraform destroy -var-file=terraform.tfvars
   ```
   
   When prompted, type `yes` to confirm. This will:
   - Delete the Cloud Run service from GCP
   - Delete the IAM policy binding
   - Update the state file to reflect empty infrastructure
   - Keep the state file locally (for reference)

3. **Verify destruction:**
   ```bash
   terraform state list
   ```
   
   The state list should be empty (no resources tracked).

4. **Clean up local files (optional):**
   ```bash
   rm -rf .terraform terraform.tfstate terraform.tfstate.backup terraform.tfvars .terraform.lock.hcl
   ```

### Key Concepts

- **terraform destroy:** Safely destroys all managed infrastructure
- **Confirmation Prompt:** Requires explicit `yes` to prevent accidental deletion
- **State File Retention:** State file is kept for reference even after destruction
- **Selective Destruction:** Can target specific resources with `-target` flag
- **Production Safety:** Always use `terraform plan -destroy` before actual destruction

---

## Bonus: Advanced State Management (Optional)

### Import Existing Resources

If you have an existing Cloud Run service (not created by Terraform), you can import it:

```bash
# First, add the resource definition to main.tf (without attributes)
# resource "google_cloud_run_v2_service" "existing" {}

# Then import it
terraform import google_cloud_run_v2_service.existing projects/PROJECT_ID/locations/REGION/services/SERVICE_NAME
```

### Use Remote State Backend

For team environments, store state in Google Cloud Storage:

```hcl
# In providers.tf or a new backend.tf file
terraform {
  backend "gcs" {
    bucket  = "my-terraform-state-bucket"
    prefix  = "cloudrun-workshop"
  }
}
```

Then run:
```bash
terraform init
```

---

## Summary of Key Commands

| Command | Purpose |
|---------|---------|
| `terraform init` | Initialize Terraform working directory |
| `terraform validate` | Validate configuration syntax |
| `terraform plan` | Preview changes without creating resources |
| `terraform apply` | Apply changes and create/modify resources |
| `terraform destroy` | Destroy all managed infrastructure |
| `terraform output` | Display computed output values |
| `terraform state list` | List all resources in state |
| `terraform state show <resource>` | Show resource details from state |
| `terraform import <resource> <id>` | Import existing resources into state |
| `terraform graph` | Generate dependency graph |

---

## Best Practices Summary

1. **Always run `terraform plan` before `apply`** — Review changes before applying
2. **Use version control** — Commit `.tf` files to Git; exclude `.tfstate` files
3. **Protect state files** — Use remote backends with encryption for production
4. **Use variables for flexibility** — Avoid hardcoding values in configuration
5. **Organize configuration logically** — Separate `main.tf`, `variables.tf`, `outputs.tf`
6. **Document your resources** — Use descriptions in variables and outputs
7. **Enable state locking** — Prevent concurrent modifications in team environments
8. **Use meaningful resource names** — Make dependency tracking and debugging easier
9. **Test in non-production first** — Apply changes to dev/staging before production
10. **Keep state file backups** — Use remote backends that support versioning

---

## Troubleshooting Guide

| Issue | Solution |
|-------|----------|
| "Error: Provider version constraints incompatible" | Run `terraform init -upgrade` to download compatible versions |
| "Error: resource already exists" | Either import it with `terraform import` or delete manually first |
| "State lock timeout" | Another Terraform operation is in progress; wait or unlock with `terraform force-unlock` |
| "Changes not reflecting on GCP" | Run `terraform plan` to check if state is out of sync; use `terraform refresh` to sync |
| "Cannot read variable without default" | Either provide value in `terraform.tfvars` or via `-var` CLI flag |
| "Sensitive output showing in logs" | Add `sensitive = true` to the output definition |

---

END LAB