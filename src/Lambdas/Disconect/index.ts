import { APIGatewayEvent } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import sendMessageToClient from "Helpers/sendMessageClient";
import Room from "Types/Room";

/**
 * @description
 *  dado a que no se quien se desconecto, tengo que intentar obtener la room dado a la conectionId,
 *  esta conection puede pertenecer al Creador como al invitado
 */
export const handler = async (event: APIGatewayEvent) => {
  const { connectionId, domainName, stage } = event.requestContext;
  const db = new DynamoDB.DocumentClient();
  const callbackUrlForAWS = `https://${domainName}/${stage}`;
  let typeOfUser: "invited" | "creator" | undefined;
  let room: Room | undefined;

  try {
    const { Item: roomByCreator } = await db
      .get({
        TableName: process.env.ROOM_TABLE,
        Key: {
          connectionIdCreator: connectionId,
        } as Room,
      })
      .promise();

    if (roomByCreator) {
      room = roomByCreator as Room;
      typeOfUser = "creator";
    } else {
      const { Items: roomByInvited } = await db
        .query({
          TableName: process.env.ROOM_TABLE,
          IndexName: "connectionIdInvited",
          KeyConditionExpression: "connectionIdInvited = :connectionIdInvited",
          ExpressionAttributeValues: {
            ":connectionIdInvited": connectionId,
          },
        })
        .promise();

      if (roomByInvited?.[0]) {
        room = roomByInvited[0] as Room;
        typeOfUser = "invited";
      }
    }
  } catch (e) {
    console.log("Problemas al intentar obtener el room.");
  }

  if (!room?.connectionIdCreator) {
    throw Error("Bad request");
  }

  if (typeOfUser === "creator") {
    if (room.connectionIdInvited)
      sendMessageToClient({
        payload: {
          data: { message: "El creador se fue de la sala." },
          eventResult: "success",
          eventName: "Disconect",
        },
        url: callbackUrlForAWS,
        connectionId: room.connectionIdInvited,
      });
  } else {
    sendMessageToClient({
      payload: {
        data: { message: "El invitado se fue de la sala." },
        eventResult: "success",
        eventName: "Disconect",
      },
      url: callbackUrlForAWS,
      connectionId: room?.connectionIdCreator,
    });
  }

  return {
    statusCode: 200,
  };
};
