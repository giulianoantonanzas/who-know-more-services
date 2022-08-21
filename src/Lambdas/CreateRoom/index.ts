import { APIGatewayEvent } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import sendMessageToClient from "Helpers/sendMessageClient";
import Room from "Types/Room";

export const handler = async (event: APIGatewayEvent) => {
  const { connectionId, domainName, stage } = event.requestContext;
  const db = new DynamoDB.DocumentClient();

  await db
    .put({
      TableName: process.env.ROOM_TABLE,
      Item: {
        connectionIdCreator: connectionId,
        createAt: new Date().toISOString(),
      } as Room,
    })
    .promise();

  const callbackUrlForAWS = `https://${domainName}/${stage}`;
  await sendMessageToClient({
    url: callbackUrlForAWS,
    connectionId,
    payload: {
      eventName: "createRoom",
      createdRoomId: connectionId,
    },
  });

  return {
    statusCode: 200,
  };
};
