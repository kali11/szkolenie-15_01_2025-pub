# Playing with HCL syntax

Below are a set of use cases for different HCL syntax operations.

## Task 1. If-then-else syntax
To the cloud run resource add a condition to check if the workspace is `dev` and if so, set the `min_instance_count` to 0, otherwise set it to 1.
> see: https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/cloud_run_v2_service#scaling-1

## Task 2. count syntax
Create new variable `apps` of type array. It should contain 3 elements: [`app1`, `app2`, `app3`]. Use the count syntax to create 3 GCS buckets with names: `app1-bucket`, `app2-bucket`, `app3-bucket`.

Use `count.index` to access the index of the current element from the array.

Here is the resorce template:
```
resource "google_storage_bucket" "app_buckets" {
  count    = length(var.apps)
  name     = RANDOM_SUFFIX_APPX-BUCKET
  location = var.region
  project  = TAKE_FROM_DATA_BLOCK
}
```

## Task 3. for_each syntax
- Create new local variable (insisde locals block) `cloudrunapps` of type map. It should look like this: 
```hcl
cloudrunapps = { 
    "app1" = {
        "image" = "nginx:alpine"
        "port" = 80
    }
    "app2" = {
        "image" = "jordangrindrod/mario:latest"
        "port" = 80
    }
    "app3" = {
        "image" = "prologic/todo"
        "port" = 8000
    }
}
```

- use `cloudrun.tf` as a reference file to create 3 Cloud Run services using `for_each` syntax.
- Remember that `each.key` is the key of the current element from the map and `each.value` is the value of the current element from the map.