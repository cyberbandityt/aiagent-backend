const { SchedulerClient, CreateScheduleCommand, DeleteScheduleCommand } = require('@aws-sdk/client-scheduler');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const scheduler = new SchedulerClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const createNewsScrapingSchedule = async (topicId, topicName) => {
  const lambdaArn = process.env.AWS_LAMBDA_ARN;
  
  const scheduleName = `news-scraper-${topicId}-${uuidv4().substring(0, 8)}`;
  
  const params = {
    Name: scheduleName,
    ScheduleExpression: 'rate(1 hour)',
    Target: {
      Arn: lambdaArn,
      RoleArn: process.env.SCHEDULER_ARN,
      Input: JSON.stringify({
        topicId,
        topicName
      })
    },
    FlexibleTimeWindow: {
      Mode: 'OFF'
    },
    State: 'ENABLED'
  };
  
  try {
    const command = new CreateScheduleCommand(params);
    const result = await scheduler.send(command);
    return {
      success: true,
      scheduleId: scheduleName,
      scheduleArn: result.ScheduleArn
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

const stopNewsScrapingSchedule = async (scheduleName) => {
  const params = {
    Name: scheduleName
  };
  
  try {
    const command = new DeleteScheduleCommand(params);
    await scheduler.send(command);
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  createNewsScrapingSchedule,
  stopNewsScrapingSchedule
};