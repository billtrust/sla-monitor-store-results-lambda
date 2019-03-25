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
      let snsRecordBody = JSON.parse(record.body)
      promises.push(processMessage(snsRecordBody.Message, record.receiptHandle))
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

  if (receiptHandle === 'MessageReceiptHandle') {
    logger.warn('Skipping delete message, receipt handle indicates local testing')
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

async function processMessage(messageBody, receiptHandle) {
  const message = JSON.parse(messageBody);
  const ISOtimestamp = process.env.IS_LOCAL ? new Date().toISOString() : getTime(message.timestamp);

  logger.debug(`Service: ${message.service}`);
  logger.debug("Groups:");
  for (let group of message.group) {
    logger.debug(`  ${group}`);
  }
  let testSuccess = message.succeeded === "true" ? true : false
  logger.debug(`Result: ${testSuccess ? "Success" : "Failed"}`);
  logger.debug(`Time: ${ISOtimestamp}`);
  logger.debug(`Execution Time: ${message.testExecutionSecs} secs`);

  var cloudwatch = new AWS.CloudWatch();

  let params = {
    MetricData: [
      {
        MetricName: `${message.service}-integration-sla`,
        Dimensions: [
          {
            Name: "Service",
            Value: `${message.service}`
          },
          {
            Name: "Region",
            Value: `${config.AWS_REGION}`
          }
        ],
        StorageResolution: 60,
        Timestamp: ISOtimestamp,
        Unit: "Count",
        Value: testSuccess ? 0 : 1
      }
    ],
    Namespace: `TEST-SLA-Monitor`
  };

  for (let group in groups) {
    
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
  logger.debug(a.toLocaleString('en-US'));
  return a.toISOString();
}

module.exports.handler = handler;