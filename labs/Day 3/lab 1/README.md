## Task 1: First Terraform configuration

Your task is to create a Terraform configuration that will deploy a simple Nginx service to Cloud Run.

TODOs:
- create files: main.tf, variables.tf, outputs.tf, providers.tf, terraform.tfvars
- install Google Provider 7.16.0
- definie variables: project_id, region, cloud_run_service_name
- use europe-west1 region
- use `data` block to reference existing project. The block can be put inside main.tf file.
- you can use `main.tf` file as a template for your solution.
- Use Cloud Run V2 service
- add `cloud_run_service_url` as an output

Tips:

1. Initialize Terraform (downloads providers and modules):
   ```bash
   terraform init
   ```

2. Validate the configuration:
   ```bash
   terraform validate
   ```

3. Format the configuration files:
   ```bash
   terraform fmt
   ```

4. Plan the deployment (preview changes):
   ```bash
   terraform plan
   ```

5. Apply the configuration (deploy resources):
   ```bash
   terraform apply
   ```
   Note: You may need to provide variable values, either via command line flags (`-var="project_id=your-project-id"`) or a `terraform.tfvars` file.

6. View outputs:
   ```bash
   terraform output
   ```

7. Destroy resources (cleanup):
   ```bash
   terraform destroy
   ```
