import { MongoClient } from "mongodb";
import { env } from "../../config/env";

const client = new MongoClient(env.MONGODB_URI);

export const getMongoDb = async () => {
  await client.connect();
  return client.db("voyagemind");
};
