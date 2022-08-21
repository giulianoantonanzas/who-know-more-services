import { APIGatewayEvent } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import sendMessageToClient from "Helpers/sendMessageClient";
import Room from "Types/Room";

type JoinRoomBody = {
  roomCode: string;
};

export const handler = async (event: APIGatewayEvent) => {
  const { connectionId, domainName, stage } = event.requestContext;
  const body = JSON.parse(event.body as string) as JoinRoomBody;
  const db = new DynamoDB.DocumentClient();
  const callbackUrlForAWS = `https://${domainName}/${stage}`;

  const { Item: room } = (await db
    .get({
      TableName: process.env.ROOM_TABLE,
      Key: {
        connectionIdCreator: body.roomCode,
      } as Room,
    })
    .promise()) as { Item?: Room };

  if (!room) {
    await sendMessageToClient({
      url: callbackUrlForAWS,
      connectionId,
      payload: {
        eventName: "JoinRoom",
        eventResult: "failed",
        message: "Codigo invalido.",
      },
    });
    return {
      statusCode: 400,
    };
  }

  await db
    .update({
      TableName: process.env.ROOM_TABLE,
      Key: {
        connectionIdCreator: body.roomCode,
      },
      UpdateExpression: "set connectionIdInvited=:connectionIdInvited",
      ExpressionAttributeValues: {
        ":connectionIdInvited": connectionId,
      },
    })
    .promise();

  Promise.all([
    sendMessageToClient({
      url: callbackUrlForAWS,
      connectionId,
      payload: {
        eventName: "JoinRoom",
        eventResult: "success",
        message: "Encontraste la sala!",
      },
    }),
    await sendMessageToClient({
      url: callbackUrlForAWS,
      connectionId: room.connectionIdCreator,
      payload: {
        eventName: "JoinRoom",
        eventResult: "success",
        message: "Alguien encontro la sala!",
      },
    }),
  ]);

  return {
    statusCode: 200,
  };
};
