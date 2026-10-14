/**
 * Local Replica Set Initializer
 * ==============================
 * Run this ONCE after starting mongod with --replSet rs0.
 * It calls rs.initiate() so that transactions work locally.
 *
 * Usage:
 *   node src/scripts/initReplicaSet.js
 *
 * Requires MongoDB to be running on localhost:27017.
 */

const { MongoClient } = require('mongodb');

async function initReplicaSet() {
  const client = new MongoClient('mongodb://127.0.0.1:27017', {
    directConnection: true,
  });

  try {
    await client.connect();
    const admin = client.db('admin');

    // Check if already initiated
    try {
      const status = await admin.command({ replSetGetStatus: 1 });
      if (status.ok === 1) {
        console.log('✓ Replica set already initiated. Status:', status.set);
        return;
      }
    } catch {
      // Not yet initiated — proceed
    }

    const result = await admin.command({
      replSetInitiate: {
        _id:     'rs0',
        members: [{ _id: 0, host: '127.0.0.1:27017' }],
      },
    });

    console.log('✓ Replica set initiated:', JSON.stringify(result, null, 2));
    console.log('');
    console.log('Wait ~5 seconds for the primary election, then start the server.');
  } catch (err) {
    console.error('✗ Failed to initiate replica set:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

initReplicaSet();
