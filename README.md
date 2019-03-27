# SLA Monitor Store Results Lambda

This is the Lambda side of the SLA Monitor project. It is the second step after the SLA Monitor Runner. The purpose of this is to launch a stack via serverless that will subscribe an SQS queue to the SNS topic created by the Runner terraform, and process the testing results to a persisted state. Primarily, this will publish custom Cloudwatch metrics to measure uptime.

Two metrics are created automatically:
* Pass and fail: 1s denote failure, making aggregated checks easy to manage.
* Execution duration of integration testing over time

A Cloudwatch metric alert is also created out of the box.

## Using

The SLA Runner publishes an SNS message containing the following.  We will subscribe this SNS to SQS and then have this Lambda consume that SQS queue to process these messages.

```json
{
    "service": "example-service",
    "group": ["dev-team", "critical"], # Send Data for failures; Over 0 marks downtime.
    "succeeded": true,
    "timestamp": "1574533200",
    "testExecutionSecs": "34" 
}
```

As an example, this message would be published as custom cloudwatch metrics with these values:

```json
{ 
    "MetricData": [
        {
            "MetricName": "example-service-integration-sla-service",
            "Timestamp": "2019-11-23T13:20:00-05:00",
            "StorageResolution": 60,
            "Value": 0,
            "Dimensions": [
                {
                "Name": "Service",
                "Value": "example-service"
                },
                {
                "Name": "Region",
                "Value": "us-east-1"
                }
            ],
            "Unit": "Count",
        },
        {
            "MetricName": "example-service-sla-test-duration-secs",
            "Timestamp": "2019-11-23T13:20:00-05:00",
            "StorageResolution": 60,
            "Value": 34,
            "Dimensions": [
                {
                "Name": "Service",
                "Value": "example-service"
                },
                {
                "Name": "Region",
                "Value": "us-east-1"
                }
            ],
            "Unit": "Count",
        },
        {
            "MetricName": "dev-team-integration-sla-group",
            "Timestamp": "2019-11-23T13:20:00-05:00",
            "StorageResolution": 60,
            "Value": 0,
            "Dimensions": [
                {
                "Name": "Service",
                "Value": "example-service"
                },
                {
                "Name": "Region",
                "Value": "us-east-1"
                }
            ],
            "Unit": "Count",
        },
        {
            "MetricName": "critical-integration-sla-group",
            "Timestamp": "2019-11-23T13:20:00-05:00",
            "StorageResolution": 60,
            "Value": 0,
            "Dimensions": [
                {
                "Name": "Service",
                "Value": "example-service"
                },
                {
                "Name": "Region",
                "Value": "us-east-1"
                }
            ],
        },
    ],
    "Namespace": "SLA-Monitor"
}
```

## Testing

```bash
export AWS_ENV="dev"
docker build -t sla-monitor-lambda .

iam-docker-run \
    --image sla-monitor-lambda \
    --profile $AWS_ENV \
    --full-entrypoint '/bin/bash ./invoke.sh' \
    --host-source-path . \
    --container-source-path /app
```

# Deploying

```bash
export AWS_ENV="dev"
docker build -t sla-monitor-lambda .

iam-docker-run \
    --image sla-monitor-lambda \
    --profile $AWS_ENV \
    --full-entrypoint sls deploy
```
