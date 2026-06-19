import mongoose from 'mongoose';

let memoryServer;

export const getMongoUri = async () => {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;

  if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT) {
    throw new Error(
      'MONGODB_URI is required on Railway. Add a MongoDB Atlas connection string in Railway → Variables.'
    );
  }

  const { MongoMemoryServer } = await import('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create();
  const uri = memoryServer.getUri();
  console.log('Using in-memory MongoDB (set MONGODB_URI for production)');
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
