import { APIGatewayEvent } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import sendMessageToClient from "Helpers/sendMessageClient";
import Room from "Types/Room";

type SetReadyBody = {
  roomCode: string;
  userId: string;
};

export const handler = async (event: APIGatewayEvent) => {
  const { domainName, stage } = event.requestContext;
  const db = new DynamoDB.DocumentClient();
  const body = JSON.parse(event.body as string) as SetReadyBody;
  const callbackUrlForAWS = `https://${domainName}/${stage}`;

  const { Item: room } = (await db
    .get({
      TableName: process.env.ROOM_TABLE,
      Key: {
        connectionIdCreator: body.roomCode,
      } as Room,
    })
    .promise()) as { Item?: Room };

  if (!room) throw new Error("invalid request");

  if (room.creatorId === body?.userId) {
    await sendMessageToClient({
      url: callbackUrlForAWS,
      connectionId: room.connectionIdInvited,
      payload: {
        eventName: "PlayerReady",
        eventResult: "success",
        data: {
          playerReady: "creator",
          message: `${room.creatorName} esta listo!`,
        },
      },
    });
  } else if (room.invitedId === body?.userId) {
    await sendMessageToClient({
      url: callbackUrlForAWS,
      connectionId: room.connectionIdCreator,
      payload: {
        eventName: "PlayerReady",
        eventResult: "success",
        data: {
          playerReady: "invited",
          message: `${room.invitedName} esta listo!`,
        },
      },
    });
  }

  return {
    statusCode: 200,
  };
};
