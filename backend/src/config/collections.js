// Rumion keeps its own MongoDB collections (rumion_users, rumion_novels, ...).
// Reason: if the database is shared with another app that already has a "users"
// collection with its own unique indexes (e.g. a unique "phone" index), registering a
// Rumion account fails with  E11000 duplicate key ... index: phone_1 dup key: { phone: null }.
// Prefixing means Rumion never touches another app's collections or indexes.
// Set COLLECTION_PREFIX="" in the environment to go back to plain names.
const prefix = process.env.COLLECTION_PREFIX === undefined ? "rumion_" : process.env.COLLECTION_PREFIX;

module.exports = (name) => `${prefix}${name}`;
