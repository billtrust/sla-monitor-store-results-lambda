const fs = require("fs"),
      WRS = require("weighted-random-selection"),
      generatedEventPath = "./events/generatedEvent.json";

let trueChance = 0.9,
    falseChance = 0.1,
    currentFile;

try {
    if (fs.existsSync(generatedEventPath)) {
        currentFile = require("./generatedEvent.json");
        if (currentFile.Records[0].receiptHandle === "FailureTestingHandle") {
            console.log("In failure conditions")
            trueChance = 0.2;
            falseChance = 0.8;
        }
    }
} catch(err) {
    console.log("First time event generation: " + err)
}

const results = [
    { result: "true", chance: trueChance },
    { result: "false", chance: falseChance }
]

let randomResult = new WRS((result) => {
    return result.chance;
});

randomResult.setItems(results);

const decideIfSuccess = function() {
    let success, receipt;
    success = randomResult.next().result;
    if (success === "true") {
        receipt = "SuccessTestingHandle";
    } else {
        receipt = "FailureTestingHandle";
    }
    return [success, receipt];
}

let SQSEventBody = require("./bodyTemplate.json");
let SQSEventMessage = {
    "service": "example-service",
    "group": ["dev-team", "critical"]
}

SQSEventMessage.timestamp = new Date().getTime();
SQSEventMessage.testExecutionSecs = Math.floor(Math.random() * (Math.floor(60) - Math.ceil(15) + 1)) + 15;
const [succeeded, receiptHandle] = decideIfSuccess();
SQSEventMessage.succeeded = succeeded;

SQSEventBody.Message = JSON.stringify(SQSEventMessage);

const SQSEventFull = {
    "Records": [
        {
            "messageId": "4c345603-810b-4fda-9d25-32891901f71d",
            "receiptHandle": receiptHandle,
            "body": JSON.stringify(SQSEventBody),
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

// console.log(SQSEventFull)
fs.writeFile(generatedEventPath, JSON.stringify(SQSEventFull), function(err) {
    if (err) throw err;
    console.log("File written");
});