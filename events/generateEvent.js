const decideIfSuccess = function() {
    const results = ["true", "true", "true", "true",
                     "false"];
    let sucess = results[Math.floor(Math.random()*results.length)];
    return sucess;
}

let SQSEventBody = require("./bodyTemplate");
let SQSEventMessage = {
    "service": "example-service",
    "group": ["dev-team", "critical"]
}

SQSEventMessage.timestamp = new Date().getTime();
SQSEventMessage.testExecutionSecs = Math.floor(Math.random() * (Math.floor(60) - Math.ceil(15) + 1)) + 15;
SQSEventMessage.succeeded = decideIfSuccess();

SQSEventBody.Message = SQSEventMessage;

const SQSEventFull = {
    "Records": [
        {
            "messageId": "4c345603-810b-4fda-9d25-32891901f71d",
            "receiptHandle": "MessageReceiptHandle",
            "body": SQSEventBody,
            "attributes": {
                "ApproximateReceiveCount": "3",
                "SentTimestamp": "1534476603214",
                "SenderId": "AIDAIT2UOQQY3AUEKVGXU",
                "ApproximateFirstReceiveTimestamp": "1534476603229"
            },
            "messageAttributes": {},
            "md5OfBody": "486fcf43c0729f744871f8b95f137ff2",
            "eventSource": "aws:sqs",
            "eventSourceARN": "arn:aws:sqs:us-east-1:123456789012:sla-monitor-store-results-dev",
            "awsRegion": "us-east-1"
        }
    ]
}