variables {
  topic_name = "testy123"
}

run "test_cloud_run_service_name" {
    command = plan

    assert {
        condition = output.topic_name == "${var.topic_name}-piotr-topic-${terraform.workspace}"
        error_message = "Cloud Run service name should contain 'test-service'"
    }
}


run "test_workspace_bucket_created" {
    command = apply

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


    assert {
        condition     = google_storage_bucket.my_bucket.name == "bucket-${data.google_project.project.project_id}-${terraform.workspace}"
        error_message = "Bucket name should match pattern 'bucket-{project_id}-{workspace}'"
    }

    assert {
        condition     = google_storage_bucket.my_bucket.project == data.google_project.project.project_id
        error_message = "Bucket project should match the configured project"
    }
}
