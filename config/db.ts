import mongoose from 'mongoose';

/**
 * MongoDB connection helper using Mongoose
 * Handles graceful connection, connection pooling, event listeners,
 * and seamless fallback if MONGODB_URI is not yet provided.
 */

let isConnected = false;

export async function connectDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.log('[Database] MONGODB_URI is not set in environment variables.');
    console.log('[Database] Operating with hybrid in-memory store so the server remains fully functional.');
    console.log('[Database] (To connect a real MongoDB instance, set MONGODB_URI="mongodb+srv://..." in .env)');
    return false;
  }

  try {
    // Avoid re-connecting if already connected
    if (mongoose.connection.readyState === 1) {
      isConnected = true;
      return true;
    }

    mongoose.connection.on('connected', () => {
      isConnected = true;
      console.log('✅ [MongoDB] Successfully connected to database.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ [MongoDB] Connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.log('⚠️ [MongoDB] Disconnected from database.');
    });

    // Connect with recommended options
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log(`✅ [MongoDB] Connected to database: ${mongoose.connection.name || 'default'}`);
    return true;
  } catch (error: any) {
    console.warn(`⚠️ [MongoDB] Could not establish connection to ${uri}:`, error.message);
    console.warn('[MongoDB] Falling back to in-memory store. App continues running without crashing.');
    isConnected = false;
    return false;
  }
}

export function isDbConnected(): boolean {
  return isConnected || mongoose.connection.readyState === 1;
}

export default connectDB;
