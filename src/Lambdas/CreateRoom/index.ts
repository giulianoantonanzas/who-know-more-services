import { APIGatewayEvent } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import sendMessageToClient from "Helpers/sendMessageClient";
import Room from "Types/Room";

type CreatorRoomBody = {
  name: string;
};

export const handler = async (event: APIGatewayEvent) => {
  const { connectionId, domainName, stage } = event.requestContext;
  const body = JSON.parse(event.body as string) as CreatorRoomBody;
  const db = new DynamoDB.DocumentClient();

  await db
    .put({
      TableName: process.env.ROOM_TABLE,
      Item: {
        connectionIdCreator: connectionId,
        creatorName: body.name,
        createAt: new Date().toISOString(),
      } as Room,
    })
    .promise();

  const callbackUrlForAWS = `https://${domainName}/${stage}`;
  await sendMessageToClient({
    url: callbackUrlForAWS,
    connectionId,
    payload: {
      eventName: "CreateRoom",
      data: { createdRoomId: connectionId },
      eventResult: "success",
    },
  });

  return {
    statusCode: 200,
  };
};
