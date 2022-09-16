import { APIGatewayEvent } from "aws-lambda";

type AddQuestionToPlayerBody = {
  roomCode: string;
  userId: string;
  question: string;
  answer: { isCorrect: boolean; title: string }[];
};

export const handler = async (event: APIGatewayEvent) => {
  console.log("Connect");
  return {
    statusCode: 200,
  };
};
