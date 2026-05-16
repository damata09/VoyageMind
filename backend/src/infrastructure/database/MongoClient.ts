import { MongoClient } from "mongodb";
import { env } from "../../config/env";

const client = new MongoClient(env.MONGODB_URI);
let isConnected = false;

export const getMongoDb = async () => {
  if (!isConnected) {
    await client.connect();
    isConnected = true;
  }
  return client.db("voyagemind");
};

export const closeMongoConnection = async () => {
  if (isConnected) {
    await client.close();
    isConnected = false;
  }
};
