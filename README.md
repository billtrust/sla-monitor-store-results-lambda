# SLA Monitor Store Results Lambda


Subscribe SNS to Queue.

Lambda triggers on queue.

Each message (sla runner results) will be persisted.

First way to persist data is as a custom Cloudwatch Metric

* Pass and fail
* Execution duration over time

Cloudwatch alert tied to Cloudwatch Metric: on failure

```json
{
    "service": "example-service",
    "group": ["dev-team", "critical"], # Send Data for failures; Over 0 marks downtime.
    "succeeded": true,
    "timestamp": "1574514000",
    "testExecutionSecs": "914" 
}
```