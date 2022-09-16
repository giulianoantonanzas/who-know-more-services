import { ExpressionAttributeValueMap } from "aws-sdk/clients/dynamodb";

/**
 * @example
 * const info=parseToUpdate({name:"giuliano",age:24})
 * data  => {ExpressionAttributeValues:{":name":"giuliano", ":age":24},UpdateExpression:"set name = :name ,age = :age"}
 */
const parseToUpdate = (dataToParse: unknown) => {
  const keysUser = Object.keys(dataToParse as object);
  const ExpressionAttributeValues: ExpressionAttributeValueMap = {};
  const now = new Date().toISOString();
  let UpdateExpression = "set ";

  keysUser.forEach((key) => {
    //@ts-ignore
    ExpressionAttributeValues[`:${key}`] = dataToParse[key];
    UpdateExpression += `${key} = :${key} ,`;
  });
  //@ts-ignore
  ExpressionAttributeValues[`:updatedAt`] = now;
  UpdateExpression += "updatedAt = :updatedAt";

  return { ExpressionAttributeValues, UpdateExpression };
};

export default parseToUpdate;
