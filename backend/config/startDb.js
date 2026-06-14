import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServer;

export const getMongoUri = async () => {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;

  memoryServer = await MongoMemoryServer.create();
  const uri = memoryServer.getUri();
  console.log('Using in-memory MongoDB (install MongoDB locally or set MONGODB_URI for production)');
  return uri;
};

export const connectDB = async () => {
  const uri = await getMongoUri();
  await mongoose.connect(uri);
  console.log('MongoDB connected');
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
};
