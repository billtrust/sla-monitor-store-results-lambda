'use strict';

const AWS = require('aws-sdk')
// const config = require('./config')
// const logger = require('./logger')

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
    done()
  }
  catch (err) {
    done(err)
  }
}

module.exports.handler = handler