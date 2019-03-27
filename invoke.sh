#!/bin/bash

# randomly execute test with valid and failed SLA monitor result
events[0]="./events/validResultPublishedEvent.json"
events[1]="./events/failedResultPublishedEvent.json"
index=$(($RANDOM % 2))

event=${events[$index]} # generatedEvent.json
echo "Testing with event: $event"

# node ./events/generateEvent.js

sls invoke local -p $event \
    -f sla-monitor-store-results-sqsworker \
    -e AWS_ENV=dev -e AWS_REGION=us-east-1 \
    --deployBucket not-a-real-bucket