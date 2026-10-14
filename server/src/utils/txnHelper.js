/**
 * Transaction Helper
 * ==================
 * Detects whether the connected MongoDB instance supports multi-document
 * transactions (replica set or sharded cluster).
 *
 * Standalone mongod instances do NOT support transactions. When a standalone
 * is detected, operations run without a session but all application-level
 * business rules (stock checks, calculations) are still enforced.
 *
 * To enable full transactions, run MongoDB as a replica set or use Atlas.
 */

const mongoose = require('mongoose');
const logger   = require('./logger');

/**
 * Returns true if the current connection is a replica set or sharded cluster
 * (i.e., transactions are supported).
 */
const isTransactional = () => {
  const topology = mongoose.connection?.client?.topology;
  if (!topology) return false;
  const desc = topology.description;
  if (!desc) return false;
  // Replica set has type 'ReplicaSetWithPrimary' or 'ReplicaSetNoPrimary'
  // Sharded cluster has 'Sharded'
  // Standalone has 'Single'
  return desc.type !== 'Single' && desc.type !== 'Unknown';
};

/**
 * Run a function inside a MongoDB transaction if the topology supports it,
 * otherwise run it without a session.
 *
 * @param {function} fn  Async function that receives (session | null)
 * @returns {Promise<*>} Result of fn
 */
const withTransaction = async (fn) => {
  if (isTransactional()) {
    const session = await mongoose.startSession();
    session.startTransaction({
      readConcern:  { level: 'snapshot' },
      writeConcern: { w: 'majority' },
    });
    try {
      const result = await fn(session);
      await session.commitTransaction();
      session.endSession();
      return result;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } else {
    // Standalone mode — warn once, then run without session
    logger.warn(
      'MongoDB is running as a standalone instance. ' +
      'Transactions are disabled. To enable full ACID transactions, ' +
      'use a replica set (rs0) or MongoDB Atlas.',
    );
    return fn(null); // session = null
  }
};

module.exports = { isTransactional, withTransaction };
