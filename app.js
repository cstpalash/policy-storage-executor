const { GetCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { DynamoDBClient } =  require("@aws-sdk/client-dynamodb");
// Set the AWS Region.
const REGION = "us-west-2"; //e.g. "us-east-1"
// Create an Amazon DynamoDB service client object.
const ddbClient = new DynamoDBClient({ region: REGION });

const { DynamoDBDocumentClient } =  require("@aws-sdk/lib-dynamodb");

const marshallOptions = {
    // Whether to automatically convert empty strings, blobs, and sets to `null`.
    convertEmptyValues: true, // false, by default.
    // Whether to remove undefined values while marshalling.
    removeUndefinedValues: true, // false, by default.
    // Whether to convert typeof object to map attribute.
    convertClassInstanceToMap: false, // false, by default.
};

const unmarshallOptions = {
    // Whether to return numbers as a string instead of converting them to native JavaScript numbers.
    wrapNumbers: false, // false, by default.
};

const translateConfig = { marshallOptions, unmarshallOptions };

// Create the DynamoDB Document client.
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient, translateConfig);


exports.handler = async function(event, context) {
  
  //console.log('## ENVIRONMENT VARIABLES: ' + serialize(process.env));
  //console.log('## CONTEXT: ' + serialize(context));
  //console.log('## EVENT: ' + serialize(event));

  let body = JSON.parse(event.body);
  //console.log('## body: ' + serialize(body));

  switch(body.source){
    case "aws.s3":
      await process_aws_s3_event(body);
      break;
    default:
      break;
  }
  
  return { ok : true };
}

// AWS - S3 start

async function process_aws_s3_event(body){

  switch(body.detail.eventName){
    case "PutBucketEncryption":
      await process_aws_s3_event_PutBucketEncryption(body);
      break; 
    case "DeleteBucketEncryption":
      await process_aws_s3_event_DeleteBucketEncryption(body);
      break;
    case "CreateBucket":
      await process_aws_s3_event_CreateBucket(body);
      break;
    default:
      break;
  }
}

async function process_aws_s3_event_PutBucketEncryption(body){

  let eventID = body.detail.eventID;
  let time = body.detail.eventTime;

  let itemPresent = await getItem(eventID, time);

  if(!itemPresent){
    //we have NOT processed this event earlier

    let record = getRecord(body); 

    let addedItem = await putItem(record);

  }

}

async function process_aws_s3_event_DeleteBucketEncryption(body){

  let eventID = body.detail.eventID;
  let time = body.detail.eventTime;

  let itemPresent = await getItem(eventID, time);

  if(!itemPresent){
    //we have NOT processed this event earlier

    let record = getRecord(body); 

    let addedItem = await putItem(record);

  }

}

async function process_aws_s3_event_CreateBucket(body){

  let eventID = body.detail.eventID;
  let time = body.detail.eventTime;

  let itemPresent = await getItem(eventID, time);

  if(!itemPresent){
    //we have NOT processed this event earlier

    let record = getRecord(body); 

    let addedItem = await putItem(record);

  }

}

function getRecord(body){
  let record = {
      eventID : body.detail.eventID,
      time : body.detail.eventTime,
      source : body.source,
      account : body.account,
      resource : body.detail.requestParameters.bucketName,
      eventName : body.detail.eventName,
      region : body.region
  };

  return record; 
}

const getItem = async function (eventID, time){
  const params = {
    TableName: "tbl_policy_execution",
    Key: {
      eventID: eventID,
      time: time
    }
  };

  let data = null;

  try {
    data = await ddbDocClient.send(new GetCommand(params));
  } catch (err) {
    console.log("Error", err);
  }

  return data.Item;
}

const putItem = async function (record){

  let params = { 
    TableName: "tbl_policy_execution",
    Item : record
  };

  let data = null;

  try{
    data = await ddbDocClient.send(new PutCommand(params));
  } catch (err){
    console.log("Error", err);
  }

  return data;
}


// AWS - S3 end

var serialize = function(object) {
  return JSON.stringify(object, null, 2)
}
