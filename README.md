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
    "timestamp": "1574515200",
    "testExecutionSecs": "914" 
}
```

This message will be published as a custom cloudwatch metric as follows:




## Testing

```bash
docker build -t sla-monitor-lambda .
docker run -it --rm -v `pwd`:/app sla-monitor-lambda

iam-docker-run \
    --image sla-monitor-lambda \
    --profile btdev-terraform \
    --shell \
    --host-source-path `pwd` \
    --container-source-path /app
```