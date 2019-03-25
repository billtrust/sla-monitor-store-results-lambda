#!/bin/bash

events[0]="./events/validResultPublishedEvent.json"
events[1]="./events/failedResultPublishedEvent.json"

index=$(($RANDOM % 2))

sls invoke local -p ${events[$index]} \
    -f sla-monitor-store-results-sqsworker \
    -e AWS_ENV=dev -e AWS_REGION=us-east-1 \
    --deployBucket not-a-real-bucket