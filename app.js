const { getItem, putItem } = require("./service/policyExecutionService.js");

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


// AWS - S3 end

var serialize = function(object) {
  return JSON.stringify(object, null, 2)
}
