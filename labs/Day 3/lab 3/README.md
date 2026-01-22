# Terraform modules

## Task 1: Create a Terraform module for Pub/Sub topic and subscription

In this module you will learn how to use Terraform modules to create a Pub/Sub topic and subscription.

TODOs:
- create a Terraform module for Pub/Sub topic and subscription


Tips:
- create a directory for the module in your main terraform project so the file structure should be like this:
```
main.tf
variables.tf
outputs.tf
providers.tf
terraform.tfvars
my-module/ # here you should put your module code
```
- module files structure is very similar to the main terraform project files structure. So create pubsub.tf, variables.tf and outputs.tf in `my-module` directory.
- the module should accept variables: project_id, topic_name, subscription_name
- you can use `pubsub.tf` file as a template for your solution. However, the subscription resource needs a `topic` attribute.
- you can also validate the module by running `terraform validate`

## Task 2: Add IAM module
- Create IAM module also. The code is ready in `iam-module` directory.

## Task 3: Use the module in the main terraform project

TODOs:
- invoke the "my-module" and "iam-module" in the main terraform project. Use the `module` block to invoke the module. In main.tf:
```hcl
module "MODULE_NAME" {
  source = "<PATH_TO_THE_MODULE>"

  project_id        = TAKE_FROM_DATA_BLOCK
  topic_name        = TAKE_FROM_VARIABLES
  subscription_name = TAKE_FROM_VARIABLES
}
```
- When you create the module code, run `terraform init` to initialize the module. You should see the module in the `.terraform/modules` directory. Inspect it's contents.
- topic_name and subscription_name should be defined as variables in the main terraform project and passed to the module
- variables for "iam-module" can be hardcoded in the main terraform project
- you should also extend the outputs.tf file in the main terraform project to include the outputs from the module "my-module"
- assign a service account created in IAM module to cloud run. You can use `service_account = module.iam.service_account_email` property in cloud run resource definition. (check docs if needed)
- remember to validate the main terraform project by running `terraform validate`
- apply the changes by running `terraform apply`