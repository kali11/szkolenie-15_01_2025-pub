# Terraform tests

## Task 1: Validation

TODOs:
- create new variable `app_owner` of type array in `variables.tf` file
- The variable will be an array of strings
- Each string should be a valid email address
- Write an expression that will validate if each string is a valid email address
- add error message to the validation expression
- variable definition temaplate:
```hcl
variable "app_ownwer" {
  description = ""
  type        = list(string)
  
  validation {
    condition = YOUR CONDITION HERE
    error_message = ANY_ERROR_MESSAGE_HERE
  }
  default = SOME_DEFAULT_VALUE_HERE
}
```

- in `terraform.tfvars` file set the variable value to the example value
- Example variable value: `["alice@example.com", "bob@example.com", "conan[at]example.com"]`
- the last email (conan) is not a valid email address, so the validation should fail
- in order to run validation execute `terraform plan`

## Task 2: Unit tests
- make sure that you have terraform 1.6.0 or higher installed (`terraform version`)
- inspect the content of `main.tftest.hcl` file and make sure that you understand what it does
- run `terraform test` to run the tests
- Now it is a time to add tests to your module
- Create new file `my-module/pubsub.tftest.hcl`
- Modify the `subscription_name` variable to be a list of strings. For example: ["subscription1", "subscription2", "subscription3"]
- Modify `pubsub.tf` file to create a new subscription for each string in the list
- Add test that will validate if the number of subscriptions created is equal to the number of strings in the input list
- in order to run tests in the module you must enter this module (`cd my-module`) and then run `terraform test`


## Task 3: Integration tests
- create new resource in main.tf that will create GCS bucket with name "bucket-{google_project}-{workspace}"
- add test that will validate if the bucket is created. This time use `command = apply`
- Note, that this command will try to set up WHOLE infrastructure and tear it down after. So all resource names must be capable of being created and destroyed. (Eg. service names must be unique)
- you can try to run the test with `terraform apply` command and see what happens. It should fail because some resources are not created yet.
- So inside test block create a full set of test variables. Eg:
```hcl
variables {
        cloud_run_service_name = "test-nginx-service-unique"
        topic_name = "test-topic-unique"
        subscription_name = ["test-sub-unique"]
        apps = ["test-app1-unique", "test-app2-unique", "test-app3-unique"]
        app_configs = {
            "test-app1-unique" = {
                image = "nginx:alpine"
                port  = 80
            }
            "test-app2-unique" = {
                image = "httpd:latest"
                port  = 80
            }
            "test-app3-unique" = {
                image = "prologic/todo"
                port  = 8000
            }
        }
    }
```

## Task 4: Mock provider

- Instead of using real GCP provider and creating real resources, we can create a mock provider. So you can delete the "variables" block from above and add mock provider to `main.tftest.hcl` file:
```hcl
mock_provider "google" {}
```
- Run `terraform test` to run the tests. No resources will be created in GCP. Mock provider will mock API calls.
- This is useful for testing purposes. However, it does not test full resource creation process.