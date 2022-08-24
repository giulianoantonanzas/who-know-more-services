import { APIGatewayEvent } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import sendMessageToClient from "Helpers/sendMessageClient";
import Room from "Types/Room";

type JoinRoomBody = {
  roomCode: string;
  name: string;
};

export const handler = async (event: APIGatewayEvent) => {
  const {
    connectionId,
    domainName,
    stage,
    identity: { sourceIp },
  } = event.requestContext;
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

  if (sourceIp === room?.creatorIp) {
    await sendMessageToClient({
      url: callbackUrlForAWS,
      connectionId,
      payload: {
        eventName: "JoinRoom",
        eventResult: "failed",
        data: {
          message: "Lamentablemente no puedes jugar contra tí mismo :(",
        },
      },
    });
    return {
      statusCode: 400,
    };
  }

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

  await db
    .update({
      TableName: process.env.ROOM_TABLE,
      Key: {
        connectionIdCreator: body.roomCode,
      },
      ConditionExpression: "connectionIdCreator=:connectionIdCreator",
      UpdateExpression:
        "set connectionIdInvited=:connectionIdInvited, invitedName=:invitedName",
      ExpressionAttributeValues: {
        ":connectionIdInvited": connectionId,
        ":invitedName": body.name,
        ":connectionIdCreator": body.roomCode,
      },
    })
    .promise();

  if (room.connectionIdCreator === connectionId) {
    await sendMessageToClient({
      url: callbackUrlForAWS,
      connectionId,
      payload: {
        eventName: "JoinRoom",
        eventResult: "failed",
        data: { message: "Acabas de crear un room." },
      },
    });
    return { statusCode: 400 };
  }

  try {
    await sendMessageToClient({
      url: callbackUrlForAWS,
      connectionId: room.connectionIdCreator,
      payload: {
        eventName: "MemberJoin",
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
        data: { message: "Se cerro la room." },
      },
    });
  }

  return {
    statusCode: 200,
  };
};
