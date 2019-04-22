'use strict';

const AWS = require('aws-sdk')
const config = require('./config')
const logger = require('./logger')

async function handler(event, context, done) {
  // raw console log output easier to copy/paste json from cloudwatch logs
  if (process.env.LOG_LEVEL == 'trace') {
    console.log('Event: ', JSON.stringify(event))
  }

  try {
    let promises = []
    for (let record of event.Records) {
      let snsRecordBody = JSON.parse(record.body);
      promises.push(processMessage(JSON.parse(snsRecordBody.Message), record.receiptHandle))
    }
    await Promise.all(promises)
    logger.debug("All processed")
    done()
  }
  catch (err) {
    done(err)
  }
}

async function deleteMessage(receiptHandle) {
  const sqs = new AWS.SQS({region: config.AWS_REGION});
  const awsAccountId = await getAwsAccountId()
  const queueUrl = `https://sqs.${config.AWS_REGION}.amazonaws.com/${awsAccountId}/${config.RESULTS_SQS_QUEUE_NAME}`
  logger.debug(`Deleting message with receiptHandle ${receiptHandle} for queueUrl: ${queueUrl}`)

  const testingHandles = ['MessageReceiptHandle', 'SuccessTestingHandle', 'FailureTestingHandle']

  if (testingHandles.includes(receiptHandle)) {
    logger.debug('Skipping delete message, receipt handle indicates local testing')
  } else {
    try {
      await sqs.deleteMessage({
        ReceiptHandle: receiptHandle,
        QueueUrl: queueUrl
      }).promise()
    }
    catch (err) {
      logger.error(`Error deleting message with receiptHandle ${receiptHandle}:`, err)
      throw err
    }
  }
}

async function getAwsAccountId() {
  const sts = new AWS.STS();
  const params = {};
  let data = await sts.getCallerIdentity(params).promise()
  return data.Account
}

async function processMessage(message, receiptHandle) {
  const cloudwatch = new AWS.CloudWatch();
  
  // Metric variables
  const namespace = config.METRIC_NAMESPACE,
        ISOtimestamp = process.env.IS_LOCAL ? new Date().toISOString() : getTime(message.timestamp),
        resolution = config.METRIC_RESOLUTION;

  let resultValueSuccess,
      resultValueFailure,
      testSucceeded = message.succeeded;
  try {
    if (testSucceeded === true) {
      resultValueSuccess = 1;
      resultValueFailure = 0;
    } else if (testSucceeded === false) {
      resultValueSuccess = 0;
      resultValueFailure = 1;
    } else {
      const msg = `Unexpected message succeeded value from SQS: ${message.succeeded}`;
      logger.error(msg);
      throw new Error(msg);
    }
  }
  catch (err) {
    const msg = `Error parsing message success value: ${err}`;
    logger.error(msg);
    throw err;
  }

  const dimensions = [
    {
      Name: "Region",
      Value: `${config.AWS_REGION}`
    },
    {
      Name: "Service",
      Value: `${message.service}`
    },
  ];

  // Metric template
  const sourceMetric = {
    Timestamp: ISOtimestamp,
    StorageResolution: resolution,
    Dimensions: dimensions,
    Unit: "Count",
  };

  let infoDebugLog = "";

  // Message logging
  infoDebugLog += `Service: ${message.service}\n`;
  infoDebugLog += "Groups:\n";
  if (message.groups.length > 0) {
    for (let group of message.groups) {
      infoDebugLog += `  ${group}\n`;
    } 
  } else {
    infoDebugLog += `  None\n`;
  }
  infoDebugLog += `Result: ${testSucceeded ? "Success" : "Failed"}\n`;
  infoDebugLog += `Time: ${ISOtimestamp}\n`;
  infoDebugLog += `Execution Time: ${message.testExecutionSecs} secs`;

  logger.debug(infoDebugLog);

  // Instantiate final object
  let finalMetrics = [];

  // Setup all metrics

  // Service metrics
  // Success
  let serviceSuccessMetric = Object.assign(
    { 
      MetricName: `integration-sla-success`,
      Value: resultValueSuccess
    },
    sourceMetric
  )

  // Failure
  let serviceFailureMetric = Object.assign(
    { 
      MetricName: `integration-sla-failure`,
      Value: resultValueFailure
    },
    sourceMetric
  );

  // Attempts
  let serviceAttemptsMetric = Object.assign(
    { 
      MetricName: `integration-sla-attempts`,
      Value: 1
    },
    sourceMetric
  );

  // Test Duration metric
  let durationMetric = Object.assign(
    { 
      MetricName: `sla-test-duration-secs`,
      Value: `${message.testExecutionSecs}`
    },
    sourceMetric,
  )

  finalMetrics.push(serviceSuccessMetric, serviceFailureMetric, serviceAttemptsMetric, durationMetric);

  // Group metrics
  for (let group of message.groups) {

    const groupDimensions = {
      Dimensions: [
        {
          Name: "Group",
          Value: `${group}`
        },
        {
          Name: "Region",
          Value: `${config.AWS_REGION}`
        }
      ]
    }

    let groupSuccessMetric = Object.assign(
      { 
        MetricName: `integration-sla-success`,
        Value: resultValueSuccess
      },
      sourceMetric,
      groupDimensions,
    );

    let groupFailureMetric = Object.assign(
      { 
        MetricName: `integration-sla-failure`,
        Value: resultValueFailure
      },
      sourceMetric,
      groupDimensions,
    );

    let groupAttemptsMetric = Object.assign(
      { 
        MetricName: `integration-sla-attempts`,
        Value: 1
      },
      sourceMetric,
      groupDimensions,
    );

    finalMetrics.push(groupSuccessMetric, groupFailureMetric, groupAttemptsMetric);
  }

  let params = {
    MetricData: finalMetrics,
    Namespace: namespace
  }

  // Log actual params to send
  for (let message in params.MetricData) {
    logger.debug(JSON.stringify(params.MetricData[message], null, 1));
  }

  await cloudwatch.putMetricData(params, function(err, data) {
    if (err) {
      logger.error(err, err.stack);
    } else {
      logger.debug(data);
    }
  }).promise();

  await deleteMessage(receiptHandle);
}

function getTime(timestamp){
  let a = new Date(timestamp * 1000);
  const isoString = a.toISOString();
  logger.debug(`Timestamp: ${isoString}`);
  return isoString;
}

module.exports.handler = handler;
