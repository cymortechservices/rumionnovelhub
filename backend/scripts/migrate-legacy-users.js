// OPTIONAL one-off: if some Rumion accounts were already saved in the shared "users" collection
// (before Rumion moved to rumion_users), copy them across. Only copies documents that have a
// "penName" field (Rumion's own), never deletes anything, safe to run more than once.
//   node scripts/migrate-legacy-users.js
require("dotenv").config();
const mongoose = require("mongoose");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const prefix = process.env.COLLECTION_PREFIX === undefined ? "rumion_" : process.env.COLLECTION_PREFIX;
  const src = db.collection("users");
  const dst = db.collection(`${prefix}users`);
  await dst.createIndex({ email: 1 }, { unique: true });

  const docs = await src.find({ penName: { $exists: true } }).toArray();
  let copied = 0;
  for (const d of docs) {
    try {
      await dst.insertOne(d);
      copied += 1;
    } catch (e) {
      if (e.code !== 11000) throw e; // already copied
    }
  }
  console.log(`Found ${docs.length} Rumion account(s) in "users"; copied ${copied} to "${prefix}users".`);
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
