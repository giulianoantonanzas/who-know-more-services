import { APIGatewayEvent } from "aws-lambda";
import { DynamoDB } from "aws-sdk";
import sendMessageToClient from "Helpers/sendMessageClient";
import Room from "Types/Room";

type GetSuggeredQuestionsBody = {
  roomCode: string;
};

export const handler = async (event: APIGatewayEvent) => {
  const { connectionId, domainName, stage } = event.requestContext;
  const db = new DynamoDB.DocumentClient();
  const body = JSON.parse(event.body as string) as GetSuggeredQuestionsBody;
  const callbackUrlForAWS = `https://${domainName}/${stage}`;

  const suggeredQuestions = [
    "¿Comida favorita?",
    "¿Qué odio hacer los domingos?",
    "¿Deporte favorito?",
    "¿Equipo de futbol?",
    "¿Peor novio/a que tuvo?",
    "¿Estilo musical preferido?",
  ];

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
      eventName: "GetSuggeredQuestions",
      eventResult: "success",
      data: {
        suggeredQuestions,
      },
    },
  });
  await sendMessageToClient({
    url: callbackUrlForAWS,
    connectionId,
    payload: {
      eventName: "GetSuggeredQuestions",
      eventResult: "success",
      data: {
        suggeredQuestions,
      },
    },
  });

  return {
    statusCode: 200,
  };
};
