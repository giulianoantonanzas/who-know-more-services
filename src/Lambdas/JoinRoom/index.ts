import { APIGatewayEvent } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import sendMessageToClient from "Helpers/sendMessageClient";
import Room from "Types/Room";

type JoinRoomBody = {
  roomCode: string;
  name: string;
  userId: string;
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
        data: { message: "Codigo invalido." },
      },
    });
    return {
      statusCode: 400,
    };
  }

  try {
    await db
      .update({
        TableName: process.env.ROOM_TABLE,
        Key: {
          connectionIdCreator: body.roomCode,
        },
        ConditionExpression: `
          connectionIdCreator=:connectionIdCreator
          and attribute_not_exists(connectionIdInvited)
          and creatorId <> :userId
       `,
        UpdateExpression: `set
          connectionIdInvited=:connectionIdInvited,
          invitedName=:invitedName,
          invitedId=:userId
        `,
        ExpressionAttributeValues: {
          ":connectionIdInvited": connectionId,
          ":invitedName": body.name,
          ":connectionIdCreator": body.roomCode,
          ":userId": body.userId,
        },
      })
      .promise();

    await sendMessageToClient({
      url: callbackUrlForAWS,
      connectionId: room.connectionIdCreator,
      payload: {
        eventName: "PlayerJoin",
        eventResult: "success",
        data: {
          message: "Alguien encontro la sala!",
          roomId: room.connectionIdCreator,
          invitedName: body.name,
        },
      },
    });
    await sendMessageToClient({
      url: callbackUrlForAWS,
      connectionId,
      payload: {
        eventName: "JoinRoom",
        eventResult: "success",
        data: {
          message: "Encontraste la sala!",
          roomId: room.connectionIdCreator,
          creatorName: room.creatorName,
        },
      },
    });
  } catch (e) {
    await sendMessageToClient({
      url: callbackUrlForAWS,
      connectionId,
      payload: {
        eventName: "JoinRoom",
        eventResult: "failed",
        data: { message: "Fallo al entrar al room" },
      },
    });
  }

  return {
    statusCode: 200,
  };
};
