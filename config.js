const config = {
    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
    LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
    RESULTS_SQS_QUEUE_NAME: process.env.RESULTS_SQS_QUEUE_NAME
  }
  
module.exports = config