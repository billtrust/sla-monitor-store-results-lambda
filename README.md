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
            "MetricName": "integration-sla-success",
            "Value": 1,
            "Timestamp": "2019-04-02T15:44:26.329Z",
            "StorageResolution": "60",
            "Dimensions": [
                {
                    "Name": "Region",
                    "Value": "us-east-1"
                },
                {
                    "Name": "Service",
                    "Value": "example-service"
                }
            ],
            "Unit": "Count"
        }
        {
            "MetricName": "integration-sla-failure",
            "Value": 0,
            "Timestamp": "2019-04-02T15:44:26.329Z",
            "StorageResolution": "60",
            "Dimensions": [
                {
                    "Name": "Region",
                    "Value": "us-east-1"
                },
                {
                    "Name": "Service",
                    "Value": "example-service"
                }
            ],
            "Unit": "Count"
        }
        {
            "MetricName": "integration-sla-attempts",
            "Value": 1,
            "Timestamp": "2019-04-02T15:44:26.329Z",
            "StorageResolution": "60",
            "Dimensions": [
                {
                    "Name": "Region",
                    "Value": "us-east-1"
                },
                {
                    "Name": "Service",
                    "Value": "example-service"
                }
            ],
            "Unit": "Count"
        }
        {
            "MetricName": "sla-test-duration-secs",
            "Value": "31",
            "Timestamp": "2019-04-02T15:44:26.329Z",
            "StorageResolution": "60",
            "Dimensions": [
                {
                    "Name": "Region",
                    "Value": "us-east-1"
                },
                {
                    "Name": "Service",
                    "Value": "example-service"
                }
            ],
            "Unit": "Count"
        }
        {
            "MetricName": "integration-sla-success",
            "Value": 1,
            "Timestamp": "2019-04-02T15:44:26.329Z",
            "StorageResolution": "60",
            "Dimensions": [
                {
                    "Name": "Group",
                    "Value": "dev-team"
                },
                {
                    "Name": "Region",
                    "Value": "us-east-1"
                },
                {
                    "Name": "Service",
                    "Value": "example-service"
                }
            ],
            "Unit": "Count"
        }
        {
            "MetricName": "integration-sla-failure",
            "Value": 0,
            "Timestamp": "2019-04-02T15:44:26.329Z",
            "StorageResolution": "60",
            "Dimensions": [
                {
                    "Name": "Group",
                    "Value": "dev-team"
                },
                {
                    "Name": "Region",
                    "Value": "us-east-1"
                },
                {
                    "Name": "Service",
                    "Value": "example-service"
                }
            ],
            "Unit": "Count"
        }
        {
            "MetricName": "integration-sla-attempts",
            "Value": 1,
            "Timestamp": "2019-04-02T15:44:26.329Z",
            "StorageResolution": "60",
            "Dimensions": [
                {
                    "Name": "Group",
                    "Value": "dev-team"
                },
                {
                    "Name": "Region",
                    "Value": "us-east-1"
                },
                {
                    "Name": "Service",
                    "Value": "example-service"
                }
            ],
            "Unit": "Count"
        }
        {
            "MetricName": "integration-sla-success",
            "Value": 1,
            "Timestamp": "2019-04-02T15:44:26.329Z",
            "StorageResolution": "60",
            "Dimensions": [
                {
                    "Name": "Group",
                    "Value": "critical"
                },
                {
                    "Name": "Region",
                    "Value": "us-east-1"
                },
                {
                    "Name": "Service",
                    "Value": "example-service"
                }
            ],
            "Unit": "Count"
        }
        {
            "MetricName": "integration-sla-failure",
            "Value": 0,
            "Timestamp": "2019-04-02T15:44:26.329Z",
            "StorageResolution": "60",
            "Dimensions": [
                {
                    "Name": "Group",
                    "Value": "critical"
                },
                {
                    "Name": "Region",
                    "Value": "us-east-1"
                },
                {
                    "Name": "Service",
                    "Value": "example-service"
                }
            ],
            "Unit": "Count"
        }
        {
            "MetricName": "integration-sla-attempts",
            "Value": 1,
            "Timestamp": "2019-04-02T15:44:26.329Z",
            "StorageResolution": "60",
            "Dimensions": [
                {
                    "Name": "Group",
                    "Value": "critical"
                },
                {
                    "Name": "Region",
                    "Value": "us-east-1"
                },
                {
                    "Name": "Service",
                    "Value": "example-service"
                }
            ],
            "Unit": "Count"
        }
    ],
    "Namespace": "SLA-Monitor"
}
```

## Testing

```bash
docker build -t sla-monitor-lambda .

export AWS_ENV="dev" && \
iam-docker-run \
    --image sla-monitor-lambda \
    --profile $AWS_ENV \
    --full-entrypoint '/bin/bash ./invokeLocal.sh'
```

Continuous data:

```bash
export AWS_ENV="dev" && \
watch -n 5 "iam-docker-run \
    --image sla-monitor-lambda \
    --profile $AWS_ENV \
    --full-entrypoint '/bin/bash ./invokeLocal.sh'
```

If you want to mount the folder in instead of building every time, you can add these lines

```
    --host-source-path . \
    --container-source-path /app
```

However, be aware that unless you run "npm install" before running invoke, you will be missing dependencies.

# Deploying

This Lambda relies on an SNS topic to have been created as part of the SLA Monitor Runner project.  First execute this Terraform by following these instructions:

https://github.com/billtrust/sla-monitor-runner#terraform

Then the SLA Monitor Store Results Lambda can be deployed by the following:

```bash
docker build -t sla-monitor-lambda .

export AWS_ENV="dev" && \
export AWS_REGION="us-east-1" && \
export DEPLOY_BUCKET='mycompany-deploy-${AWS_ENV}-${AWS_REGION}' && \
iam-docker-run \
    --image sla-monitor-lambda \
    --profile $AWS_ENV \
    --full-entrypoint "sls deploy --deployBucket $DEPLOY_BUCKET"
```

