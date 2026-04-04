const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const connectDB = async () => {
  try {
    // If a URI is provided in env (e.g. Atlas), use it. 
    // Otherwise fallback to Memory Server.
    // Note: Localhost failing previously means we probably want Memory Server strictly here unless configured otherwise.
    
    if (process.env.USE_MEMORY_DB === 'true' || !process.env.MONGO_URI || process.env.MONGO_URI.includes('localhost')) {
      mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      console.log(`Using In-Memory Mongo: ${uri}`);
      await mongoose.connect(uri);
    } else {
      await mongoose.connect(process.env.MONGO_URI);
      console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;