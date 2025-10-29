import mongoose from 'mongoose';

export const connectDB = async (uri) => {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    autoIndex: true,
    // If provided, override DB name from URI. Helpful when URI lacks a path.
    dbName: process.env.DB_NAME || undefined
  });
  console.log('MongoDB connected:', mongoose.connection.name);
};
