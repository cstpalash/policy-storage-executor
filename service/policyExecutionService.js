const { GetCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { ddbDocClient } = require("../libs/ddbDocClient.js");

exports.getItem = async function getItem(eventID, time){
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

exports.putItem = async function putItem(record){

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