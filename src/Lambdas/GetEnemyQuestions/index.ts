import { APIGatewayEvent } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import sendMessageToClient from "Helpers/sendMessageClient";
import Room from "Types/Room";

type GetEnemyQuestions = {
  roomCode: string;
};

export const handler = async (event: APIGatewayEvent) => {
  const { connectionId, domainName, stage } = event.requestContext;
  const db = new DynamoDB.DocumentClient();
  const body = JSON.parse(event.body as string) as GetEnemyQuestions;
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

  await sendMessageToClient({
    url: callbackUrlForAWS,
    connectionId: room.connectionIdCreator,
    payload: {
      eventName: "GetEnemyQuestions",
      eventResult: "success",
      data: { ...room.inviteQuestions },
    },
  });
  await sendMessageToClient({
    url: callbackUrlForAWS,
    connectionId,
    payload: {
      eventName: "GetEnemyQuestions",
      eventResult: "success",
      data: {
        ...room.creatorQuestions,
      },
    },
  });

  return {
    statusCode: 200,
  };
};
