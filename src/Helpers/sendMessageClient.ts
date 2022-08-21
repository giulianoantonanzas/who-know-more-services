import AWS from "aws-sdk";

const sendMessageToClient = (options: {
  url: string;
  connectionId?: string;
  payload: Record<string, unknown>;
}) =>
  new Promise((resolve, reject) => {
    const apiGatewayManagementApi = new AWS.ApiGatewayManagementApi({
      apiVersion: "2018-11-29",
      endpoint: options.url,
    });
    apiGatewayManagementApi.postToConnection(
      {
        ConnectionId: options?.connectionId ?? "",
        Data: JSON.stringify(options.payload),
      },
      (err, data) => {
        if (err) {
          console.log("sendMessageToClient ERROR==>", err);
          reject(err);
        }
        resolve(data);
      }
    );
  });

export default sendMessageToClient;
