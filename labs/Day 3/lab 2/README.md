## Task 1: Move Terraform state to GCS bucket

Your task is to create a GCS bucket (manually) and then move the terraform state to this bucket.

TODOs:
- create a GCS bucket manually (gcloud cli or Google Cloud Console)
- update the providers.tf file to use the new bucket for state storage
- after you migrate the state, verify the state is in the new bucket

Tips:
1. in order to set-up a backend modify providers.tf file and add this code to `terraform` block:
```hcl
backend "gcs" {
  bucket  = "BUCKET_NAME"
  prefix  = "PROFIX"
}
```
2. After you modify the code, you need to migrate the state to the new bucket. You can do this by running:
```bash
terraform init -migrate-state
```
3. Verify current state:
```bash
terraform state list
```