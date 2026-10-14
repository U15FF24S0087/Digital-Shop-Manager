/**
 * Jest global setup / teardown
 * =============================
 * Uses an in-memory MongoDB server (mongodb-memory-server) so tests never
 * touch a real database and work without a running replica set.
 *
 * NOTE: For transaction tests we use a MongoMemoryReplSet (replica set)
 * so that multi-document transactions are available.
 */

const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

let replSet;

/**
 * Called once before all test files.
 */
const connectTestDB = async () => {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });
  const uri = replSet.getUri();
  process.env.MONGO_URI      = uri;
  process.env.JWT_SECRET     = 'test_jwt_secret_at_least_32_chars_long!!';
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_chars!!';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.NODE_ENV       = 'test';

  await mongoose.connect(uri);
};

/**
 * Clear all collections between test files.
 */
const clearDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
};

/**
 * Called once after all test files.
 */
const disconnectTestDB = async () => {
  await mongoose.disconnect();
  if (replSet) await replSet.stop();
};

module.exports = { connectTestDB, clearDB, disconnectTestDB };
