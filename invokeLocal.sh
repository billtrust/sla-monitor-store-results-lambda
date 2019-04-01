#!/bin/bash

node ./events/generateTestingEvent.js

GENERATION_EXIT_CODE=$?

if [[ $GENERATION_EXIT_CODE > 0 ]]; then
    echo "Test json generation failed with exit code: $GENERATION_EXIT_CODE"
    exit $GENERATION_EXIT_CODE
fi

testType=$(cat events/generatedEvent.json | jq '.Records[0] .receiptHandle')

echo "Testing with event: $testType"

sls invoke local -p ./events/generatedEvent.json \
    -f sla-monitor-store-results-sqsworker \
    -e AWS_ENV=dev -e AWS_REGION=us-east-1 \
    --deployBucket not-a-real-bucket