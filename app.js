const { GetCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { DynamoDBClient } =  require("@aws-sdk/client-dynamodb");
const { S3Client, GetBucketEncryptionCommand } = require("@aws-sdk/client-s3");
const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");

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

const s3Client = new S3Client({ REGION : REGION });

const lambdaClient = new LambdaClient({ REGION : REGION });

exports.handler = async function(event, context) {
  
  //console.log('## ENVIRONMENT VARIABLES: ' + serialize(process.env));
  //console.log('## CONTEXT: ' + serialize(context));
  //console.log('## EVENT: ' + serialize(event));

  let body = JSON.parse(event.body);
  console.log(serialize(body));

  switch(body.source){
    case "aws.s3":
      await process_aws_s3_event(body);
      break;
    default:
      break;
  }

  let body = JSON.stringify({ message : "OK" });
  let statusCode = '200';
  const headers = {
      'Content-Type': 'application/json',
  };
  
  return {
      statusCode,
      body,
      headers,
  };
}

// AWS - S3 start

async function process_aws_s3_event(body){

  switch(body.detail.eventName){
    case "PutBucketEncryption":
    case "DeleteBucketEncryption":
    case "CreateBucket":
      await process_aws_s3_event_body(body);
      break; 
    default:
      break;
  }
}

async function process_aws_s3_event_body(body){

  let eventID = body.detail.eventID;
  let time = body.detail.eventTime;

  let itemPresent = await getItem(eventID, time);

  if(!itemPresent){
    //we have NOT processed this event earlier

    let record = getRecord(body); 

    let encryptionConfig = await getEncryptionConfiguration(record.resource);

    if(encryptionConfig){

      let policyResponse = await validatePolicy(encryptionConfig);

      let validationResult = binArrayToJson(policyResponse.Payload);

      await putItem(Object.assign(record, { executionType : "Continuous Compliance" }, validationResult));

    }

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

const getEncryptionConfiguration = async function(bucketName){
  let response = null;

  try{

    response = await s3Client.send(new GetBucketEncryptionCommand({ Bucket : bucketName }));

  } catch (err){
      if(err.Code == "ServerSideEncryptionConfigurationNotFoundError"){
        response = {};
      }
      else {
        console.log(err.Code);
      }
  }

  return response;
}

const validatePolicy = async function(config){

  let response = null;
  let payload = serialize({
    "action" : "validate-aws-s3-encryption-configuration",
    "metadata" : config
  });

  try{
    response = await lambdaClient.send(new InvokeCommand({
      FunctionName : "fn-policy-storage-encryption",
      Payload : payload
    }));
  } catch(err){
    console.log("Error", err);
  }

  return response;
}


// AWS - S3 end

var serialize = function(object) {
  return JSON.stringify(object, null, 2)
}

var binArrayToJson = function(binArray)
{
  var str = "";
  for (var i = 0; i < binArray.length; i++) {
    str += String.fromCharCode(parseInt(binArray[i]));
  }
  return JSON.parse(str)
}
