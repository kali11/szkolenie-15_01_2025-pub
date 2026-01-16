# Google Cloud Run Management Workshop - Polar H10 Backend

## Workshop Overview

In this practical workshop, you will learn how to deploy, manage, and optimize a containerized Django application on Google Cloud Run. You'll build a Docker image, push it to Artifact Registry, and gain hands-on experience with autoscaling, traffic management, and revision handling using the Polar H10 Backend application.

### Learning Objectives

By the end of this workshop, you will be able to:
- Build a Docker image for a Django application
- Push Docker images to Google Cloud Artifact Registry
- Deploy a containerized application to Cloud Run from Artifact Registry
- Configure environment variables for Cloud Run services
- Configure and manage autoscaling policies
- Handle concurrent requests and optimize performance
- Split traffic between revisions for canary deployments
- Implement gradual rollouts with traffic management
- Optimize cold starts using minimum instances
- Manage and rollback revisions

### Prerequisites

- Access to a Google Cloud Platform project with Cloud Run API enabled
- Google Cloud SDK (`gcloud`) installed and configured
- Basic familiarity with command-line interface
- Web browser for accessing Cloud Console
- Access to the `polarh10-backend` source code directory
- Docker installed locally (for building the image)
- An existing Google Cloud Pub/Sub subscription (assumed to exist)
- A service account JSON key file stored in Google Cloud Storage and made publicly accessible (for cross-project Pub/Sub authentication)


---

## Task 0: Build and Push Docker Image to Artifact Registry

### Overview
Before deploying to Cloud Run, you need to build the Docker image for the `polarh10-backend` application and push it to Google Cloud Artifact Registry. Artifact Registry is Google Cloud's managed Docker registry service and is the recommended approach for production deployments.

### Step-by-Step Instructions

1. **Set up environment variables** in your Cloud Shell or terminal:
   ```bash
   export PROJECT_ID=$(gcloud config get-value project)
   export PUBSUB_PROJECT_ID=your-pubsub-project-id
   export REGION=europe-west1
   export SERVICE_NAME=polarh10-backend
   export ARTIFACT_REGISTRY_REPO=cloud-run-repo
   ```

2. **Enable Artifact Registry API:**
   ```bash
   gcloud services enable artifactregistry.googleapis.com
   ```

3. **Create Artifact Registry repository (if it doesn't exist):**
   ```bash
   gcloud artifacts repositories create $ARTIFACT_REGISTRY_REPO \
     --repository-format=docker \
     --location=$REGION \
     --description="Docker repository for Cloud Run services"
   ```
   If the repository already exists, you'll see an error message. This is fine - you can proceed to the next step.

4. **Configure Docker authentication:**
   ```bash
   gcloud auth configure-docker $REGION-docker.pkg.dev
   ```
   This allows Docker to authenticate with Artifact Registry.

5. **Navigate to the application directory and build the Docker image:**
   ```bash
   cd polarh10-backend
   docker build -t $REGION-docker.pkg.dev/$PROJECT_ID/$ARTIFACT_REGISTRY_REPO/$SERVICE_NAME\:latest .
   ```

   > If you are building on ARM CPU (eg. MacBook MX) add this flag: `--platform=linux/amd64` to build command

   This command:
   - Builds the Docker image using the Dockerfile in the current directory
   - Tags it with the Artifact Registry naming convention: `REGION-docker.pkg.dev/PROJECT_ID/REPO_NAME/IMAGE_NAME:TAG`
   - Uses `:latest` as the tag

6. **Push the image to Artifact Registry:**
   ```bash
   docker push $REGION-docker.pkg.dev/$PROJECT_ID/$ARTIFACT_REGISTRY_REPO/$SERVICE_NAME\:latest
   ```
   This uploads the image to your Artifact Registry repository. The first push may take a few minutes depending on the image size.

7. **Verify the image was pushed successfully:**
   ```bash
   gcloud artifacts docker images list $REGION-docker.pkg.dev/$PROJECT_ID/$ARTIFACT_REGISTRY_REPO/$SERVICE_NAME
   ```
   You should see your image listed with the `latest` tag.

### Key Concepts
- **Artifact Registry**: Google Cloud's managed Docker registry service for storing and managing container images
- **Image naming convention**: `REGION-docker.pkg.dev/PROJECT_ID/REPO_NAME/IMAGE_NAME:TAG`
- **Docker authentication**: Required to push/pull images from Artifact Registry
- **Image tags**: Use semantic versioning or descriptive tags (e.g., `v1.0.0`, `latest`, `production`)

---

## Task 1: Deploy Polar H10 Backend to Cloud Run

### Overview
Deploy the Polar H10 Backend Django application from Artifact Registry to Cloud Run with public access enabled. This application provides a REST API for heart rate data and includes a Pub/Sub subscriber for processing messages.

### Step-by-Step Instructions

1. **Set up environment variables** in your Cloud Shell or terminal:
   ```bash
   export PROJECT_ID=$(gcloud config get-value project)
   export REGION=europe-west1
   export SERVICE_NAME=polarh10-backend
   export ARTIFACT_REGISTRY_REPO=cloud-run-repo
   export SUBSCRIPTION_NAME=heartrate-subscription  # Update with your actual subscription name
   export GCS_KEY_FILE_URL=https://storage.googleapis.com/your-bucket/service-account-key.json  # Public URL to service account key
   ```
   **Note**: 
   - Make sure to set `SUBSCRIPTION_NAME` to match your existing Pub/Sub subscription name.
   - Set `GCS_KEY_FILE_URL` to the public HTTPS URL of your service account JSON key file in Google Cloud Storage. This is required if your Pub/Sub subscription is in a different project.

2. **Deploy the application to Cloud Run:**
   ```bash
   gcloud run deploy $SERVICE_NAME \
     --image $REGION-docker.pkg.dev/$PROJECT_ID/$ARTIFACT_REGISTRY_REPO/$SERVICE_NAME\:latest \
     --region $REGION \
     --allow-unauthenticated \
     --platform managed \
     --port 8000 \
     --set-env-vars PROJECT_ID=$PUBSUB_PROJECT_ID,SUBSCRIPTION_NAME=$SUBSCRIPTION_NAME,GCS_KEY_FILE_URL=$GCS_KEY_FILE_URL
   ```
   This command:
   - Uses the image from Artifact Registry (built in Task 0)
   - Deploys to the `europe-west1` region
   - Allows public HTTP access without authentication
   - Uses managed Cloud Run (not Cloud Run on GKE)
   - Sets the container port to 8000 (Django default)
   - Configures required environment variables: `PROJECT_ID`, `SUBSCRIPTION_NAME`, and `GCS_KEY_FILE_URL`

3. **Verify the deployment:**
   When the deployment completes, you'll see output with a **Service URL**. Test the API endpoints:
   ```bash
   SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
     --region $REGION --format='value(status.url)')
   
   # Test the API endpoints
   curl $SERVICE_URL/api/heartrate/
   curl $SERVICE_URL/api/heartrate/latest/
   curl $SERVICE_URL/api/heartrate/stats/
   ```
   You should receive JSON responses from the Django REST API.

4. **Check the service status in Cloud Console:**
   ```bash
   gcloud run services list --region $REGION
   ```
   This shows all services deployed in your region.

5. **Inspect the current revision:**
   ```bash
   gcloud run revisions list --service $SERVICE_NAME --region $REGION
   ```
   You should see one revision with the naming pattern `polarh10-backend-00001`.

6. **Check the service logs to verify Pub/Sub subscriber is running:**
   ```bash
   gcloud run services logs read $SERVICE_NAME --region $REGION --limit 20
   ```
   You should see logs indicating that both the Django server and Pub/Sub subscriber have started.

### Key Concepts
- **Service:** A logical unit representing your application on Cloud Run
- **Revision:** A specific version of your service (immutable deployment)
- **Concurrency:** The number of concurrent requests a single instance can handle
- **Default concurrency:** Cloud Run instances handle 80 concurrent requests by default
- **Environment variables:** Required for application configuration:
  - `PROJECT_ID`: Google Cloud Project ID for Pub/Sub client
  - `SUBSCRIPTION_NAME`: Name of the Pub/Sub subscription to listen to
  - `GCS_KEY_FILE_URL`: (Optional) Public HTTPS URL to service account JSON key file for cross-project Pub/Sub authentication

---

## Task 2: Configure Autoscaling Policies and Concurrent Request Handling

### Overview
Learn how Cloud Run autoscales based on concurrent requests and configure the maximum concurrency per instance.

### Step-by-Step Instructions

1. **Update the service with custom concurrency settings:**
   ```bash
   gcloud run services update $SERVICE_NAME \
     --region $REGION \
     --concurrency 100 \
     --max-instances 10 \
     --min-instances 1
   ```
   This configuration:
   - **--concurrency 100**: Each instance will handle up to 100 concurrent requests before Cloud Run scales up
   - **--max-instances 10**: Service will not exceed 10 instances even under heavy load
   - **--min-instances 1**: Keep 1 instance warm at all times (reduces cold starts)

2. **Verify the updated settings:**
   ```bash
   gcloud run services describe $SERVICE_NAME \
     --region $REGION \
     --format='value(template.spec.containerConcurrency)'
   ```
   This should return `100`.

3. **View scaling configuration details:**
   ```bash
   gcloud run services describe $SERVICE_NAME \
     --region $REGION \
     --format='value(template.spec.maxInstances,template.spec.minInstances)'
   ```
   This should show `10` and `1` respectively.

4. **Understand autoscaling behavior:**
   - When requests arrive, Cloud Run distributes them across instances
   - Each instance handles up to the concurrency limit (100 in this case)
   - If all instances reach 60% CPU or concurrency capacity, new instances are created
   - Requests queue for up to 10 seconds if no instances are available
   - Idle instances (not serving traffic) may be kept for 15 minutes, then removed

5. **Test autoscaling with load generation using httperf:**
   
   First, install `httperf` if it's not already available:
   ```bash
   # On macOS
   brew install httperf
   
   # On Ubuntu/Debian
   sudo apt-get install httperf
   
   # On Cloud Shell (already available)
   # httperf is pre-installed
   ```
   
   Get your service URL:
   ```bash
   SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
     --region $REGION \
     --format='value(status.url)')
   ```
   
   Generate load to trigger autoscaling:
   ```bash
   # Extract hostname from URL
   HOSTNAME=$(echo $SERVICE_URL | sed 's|https\?://||' | cut -d'/' -f3)
   
   # Generate load
   httperf \
      --server=$HOSTNAME \
      --port=443 \
      --ssl \
      --uri=/api/heartrate/ \
      --num-conns=1000 \
      --rate=100
   ```
   
   Go to GCP console, look for your Cloud Run service, and check the "Metrics" tab. You should see the instance count and request metrics.
   

### Key Concepts
- **Concurrency**: Maximum requests per instance (default 80, max 1000)
- **Auto-scaling trigger**: Based on request queue and CPU utilization (targeting 60%)
- **Cold start**: Delay when scaling from zero instances
- **Minimum instances**: Keep instances warm to eliminate cold starts

---

## Task 3: Implement Traffic Splitting and Gradual Rollouts

### Overview
Deploy a new version of your service and use traffic splitting to gradually shift traffic from the old version to the new version (canary deployment pattern).

### Step-by-Step Instructions

1. **Deploy a new revision without receiving traffic:**
   ```bash
   gcloud run deploy $SERVICE_NAME \
     --image $REGION-docker.pkg.dev/$PROJECT_ID/$ARTIFACT_REGISTRY_REPO/$SERVICE_NAME\:latest \
     --region $REGION \
     --allow-unauthenticated \
     --no-traffic \
     --tag=ver2 \
     --port 8000 \
     --set-env-vars PROJECT_ID=$PUBSUB_PROJECT_ID,SUBSCRIPTION_NAME=$SUBSCRIPTION_NAME,GCS_KEY_FILE_URL=$GCS_KEY_FILE_URL
   ```
   The `--no-traffic` flag ensures the new revision doesn't immediately receive traffic. This allows you to test it before routing production traffic.

   > As an output you should get a revision url. Not, that is starts with tag ver2.

2. **List revisions to see both versions:**
   ```bash
   gcloud run revisions list --service $SERVICE_NAME --region $REGION
   ```
   You should see two revisions now (with names like `polarh10-backend-00001` and `polarh10-backend-00002`).

3. **Get revision names for traffic splitting:**
   ```bash
   # Store the revision names
   REVISION_1=$(gcloud run revisions list --service $SERVICE_NAME \
     --region $REGION --format='value(REVISION)' | tail -2 | head -1)
   
   REVISION_2=$(gcloud run revisions list --service $SERVICE_NAME \
     --region $REGION --format='value(REVISION)' | tail -1)
   
   echo "Old revision: $REVISION_1"
   echo "New revision: $REVISION_2"
   ```

4. **Split traffic 90% to old, 10% to new (canary deployment):**
   ```bash
   gcloud run services update-traffic $SERVICE_NAME \
     --region $REGION \
     --to-revisions=$REVISION_1=90,$REVISION_2=10
   ```

5. **Verify the traffic split:**
   ```bash
   gcloud run services describe $SERVICE_NAME \
     --region $REGION \
     --format='value(status.traffic[*].[tag, percent, revisionName])'
   ```

6. **Gradually increase traffic to the new version:**
   ```bash
   # Increase to 50% traffic to new version
   gcloud run services update-traffic $SERVICE_NAME \
     --region $REGION \
     --to-revisions=$REVISION_1=50,$REVISION_2=50
   ```

7. **Test the endpoints:**
   ```bash
   SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
     --region $REGION --format='value(status.url)')
   
   # Make multiple requests to see traffic distribution
   for i in {1..10}; do 
     echo "Request $i:"
     curl -s "$SERVICE_URL/api/heartrate/stats/" | head -c 100
     echo ""
   done
   ```
   With traffic splitting, you'll hit different revisions based on the configured percentages.

### Key Concepts
- **Revision tagging**: Use `--tag=ver2` to create accessible revision-specific URLs
- **Traffic splitting**: Send different percentages to different revisions
- **Gradual rollout**: Start with small percentage (5-10%) and increase gradually
- **Quick rollback**: Redirect 100% traffic back to previous revision if issues occur

---

## Task 4: Traffic Management with Tags and Rollback Strategy

### Overview
Implement a production-ready traffic management strategy with tagged revisions and quick rollback capability.

### Step-by-Step Instructions

1. **Deploy with explicit tags for traffic management:**
   ```bash
   # Deploy stable version
   gcloud run deploy $SERVICE_NAME \
     --image $REGION-docker.pkg.dev/$PROJECT_ID/$ARTIFACT_REGISTRY_REPO/$SERVICE_NAME\:latest \
     --region $REGION \
     --allow-unauthenticated \
     --tag=stable \
     --tag=prod \
     --port 8000 \
     --set-env-vars PROJECT_ID=$PUBSUB_PROJECT_ID,SUBSCRIPTION_NAME=$SUBSCRIPTION_NAME,GCS_KEY_FILE_URL=$GCS_KEY_FILE_URL
   ```

2. **Deploy canary version with different tag:**
   ```bash
   gcloud run deploy $SERVICE_NAME \
     --image $REGION-docker.pkg.dev/$PROJECT_ID/$ARTIFACT_REGISTRY_REPO/$SERVICE_NAME\:latest \
     --region $REGION \
     --allow-unauthenticated \
     --no-traffic \
     --tag=canary \
     --port 8000 \
     --set-env-vars PROJECT_ID=$PUBSUB_PROJECT_ID,SUBSCRIPTION_NAME=$SUBSCRIPTION_NAME,GCS_KEY_FILE_URL=$GCS_KEY_FILE_URL
   ```

3. **Direct traffic to specific tags:**
   ```bash
   # Send 95% to stable, 5% to canary
   gcloud run services update-traffic $SERVICE_NAME \
     --region $REGION \
     --to-tags=stable=95,canary=5
   ```

4. **Verify traffic distribution:**
   ```bash
   gcloud run services describe $SERVICE_NAME \
     --region $REGION \
     --format='table(status.traffic[*].[tag, percent])'
   ```

5. **Implement quick rollback:**
   ```bash
   # If canary has issues, immediately rollback to stable
   gcloud run services update-traffic $SERVICE_NAME \
     --region $REGION \
     --to-tags=stable=100
   
   # Verify rollback
   gcloud run services describe $SERVICE_NAME \
     --region $REGION --format='value(status.traffic[*].tag, status.traffic[*].percent)'
   ```

6. **Access revision-specific URLs for testing:**
   ```bash
   # Each tagged revision gets its own URL
   # Stable URL: https://stable---polarh10-backend-<hash>.<region>.a.run.app
   # Canary URL: https://canary---polarh10-backend-<hash>.<region>.a.run.app
   
   # Get the canary URL directly for testing before full traffic shift
   CANARY_URL=$(gcloud run services describe $SERVICE_NAME \
     --region $REGION --format='value(status.traffic[?tag=="canary"].url)')
   
   echo "Canary URL for testing: $CANARY_URL"
   
   # Test the canary API endpoint
   if [ ! -z "$CANARY_URL" ]; then
     curl "$CANARY_URL/api/heartrate/stats/"
   fi
   ```

### Key Concepts
- **Tag-based routing**: Each tag creates a dedicated URL for that revision
- **Non-traffic tags**: Tags that don't receive traffic allow testing before promotion
- **Rapid rollback**: Sending 100% traffic back to stable is instant
- **Monitoring**: Always monitor canary metrics before increasing traffic percentage
- **API testing**: Test canary revision API endpoints before shifting production traffic

---

## Cleanup Instructions

To avoid unnecessary charges, clean up resources:

```bash
# Delete the Cloud Run service (this deletes all revisions)
gcloud run services delete $SERVICE_NAME --region $REGION --quiet

# Optional: Delete the Artifact Registry image (if you want to clean up completely)
gcloud artifacts docker images delete $REGION-docker.pkg.dev/$PROJECT_ID/$ARTIFACT_REGISTRY_REPO/$SERVICE_NAME:latest \
  --delete-tags --quiet

# Or, to keep the service but reduce costs:
gcloud run services update $SERVICE_NAME \
  --region $REGION \
  --min-instances=0 \
  --max-instances=10
```

---

## Summary of Key Commands

| Command | Purpose |
|---------|---------|
| `gcloud artifacts repositories create` | Create an Artifact Registry repository |
| `gcloud auth configure-docker` | Configure Docker authentication for Artifact Registry |
| `docker build` | Build a Docker image |
| `docker push` | Push an image to Artifact Registry |
| `gcloud run deploy` | Deploy a new service or revision |
| `gcloud run services list` | List all Cloud Run services |
| `gcloud run services describe` | Get detailed service configuration |
| `gcloud run revisions list` | List all revisions for a service |
| `gcloud run services update-traffic` | Manage traffic splitting and tags |
| `gcloud run services update` | Update service settings (concurrency, min/max instances) |
| `gcloud run revisions delete` | Delete a specific revision |

---

## Best Practices

1. **Always start with small traffic percentages** when deploying new revisions (5-10%)
2. **Monitor metrics for 5-10 minutes** before increasing canary traffic
3. **Use meaningful tags** for easy identification (e.g., "stable", "canary", "v1", "v2")
4. **Set appropriate min-instances** (0 for cost optimization, 1+ for latency-sensitive services like Django)
5. **Keep max-instances reasonable** to prevent unexpected cost spikes
6. **Test revision-specific URLs** before shifting all traffic
7. **Implement automated rollback** in CI/CD pipelines for failed deployments
8. **Monitor cold starts** using Cloud Trace and adjust min-instances accordingly
9. **Verify environment variables** are set correctly in all deployments (including `GCS_KEY_FILE_URL` if using cross-project Pub/Sub)
10. **Test API endpoints** after each deployment to ensure functionality
11. **Secure service account keys**: If using `GCS_KEY_FILE_URL`, ensure the service account has minimal required permissions (only `roles/pubsub.subscriber` in the subscription's project)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Service not accessible | Check `--allow-unauthenticated` flag and verify service URL |
| Can't delete revision | The revision must not be serving any traffic |
| High cold start latency | Increase `--min-instances` to keep warm instances ready |
| 429 Too Many Requests | Increase `--max-instances` or reduce `--concurrency` |
| Unexpected costs | Review `--min-instances` and `--max-instances` settings |
| Docker build fails | Check Dockerfile syntax and ensure all dependencies are available |
| Image push fails | Verify Docker authentication: `gcloud auth configure-docker` |
| Environment variable errors | Ensure `PROJECT_ID` and `SUBSCRIPTION_NAME` are set in all deployments. If using cross-project Pub/Sub, also set `GCS_KEY_FILE_URL` |
| API returns 500 errors | Check Cloud Run logs: `gcloud run services logs read $SERVICE_NAME --region $REGION` |
| Pub/Sub subscriber not working | Verify `SUBSCRIPTION_NAME` matches an existing subscription and check service logs. If subscription is in another project, ensure `GCS_KEY_FILE_URL` points to a publicly accessible service account key file with proper permissions |
| Pub/Sub authentication errors | Verify the service account key file at `GCS_KEY_FILE_URL` has `roles/pubsub.subscriber` permission in the project containing the subscription. Check that the GCS file is publicly accessible |

---

## Application Notes

### Polar H10 Backend Application
- **Framework**: Django with Django REST Framework
- **Port**: 8000 (Django default)
- **Environment Variables Required**:
  - `PROJECT_ID`: Google Cloud Project ID for Pub/Sub client
  - `SUBSCRIPTION_NAME`: Name of the Pub/Sub subscription to listen to
  - `GCS_KEY_FILE_URL`: (Optional) Public HTTPS URL to service account JSON key file stored in Google Cloud Storage. Required when the Pub/Sub subscription is in a different project than the Cloud Run service. The key file will be automatically downloaded at container startup and used for Pub/Sub authentication.
- **API Endpoints**:
  - `GET /api/heartrate/` - List all heart rate readings (paginated)
  - `GET /api/heartrate/?minutes=5` - Get readings from last N minutes
  - `GET /api/heartrate/{id}/` - Get single reading
  - `GET /api/heartrate/latest/` - Get most recent reading
  - `GET /api/heartrate/stats/` - Get aggregated statistics
- **Background Process**: Pub/Sub subscriber runs alongside Django server
- **Database**: Uses Django migrations (automatically run on container startup)

---

END LAB
