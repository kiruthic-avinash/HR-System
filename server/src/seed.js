/* Seeds a verified admin and sample employees for local development.
   Runs automatically on server boot in dev when the DB is empty,
   or standalone (with the API stopped) via: npm run seed */
const User = require('./models/User');

const USERS = [
  { employeeId: 'ADM001', email: 'admin@hr-system.local', password: 'Admin@123', role: 'admin' },
  { employeeId: 'EMP001', email: 'alice@hr-system.local', password: 'Alice@123', role: 'employee' },
  { employeeId: 'EMP002', email: 'bob@hr-system.local', password: 'Bob@12345', role: 'employee' },
];

async function seedUsers() {
  for (const spec of USERS) {
    let user = await User.findOne({ email: spec.email });
    if (!user) {
      user = new User({ employeeId: spec.employeeId, email: spec.email, role: spec.role });
      await user.setPassword(spec.password);
      user.isEmailVerified = true;
      await user.save();
      console.log(`[seed] Created ${spec.role}: ${spec.email} / ${spec.password}`);
    }
  }
}

module.exports = { seedUsers };

if (require.main === module) {
  const { connectDb, disconnectDb } = require('./config/db');
  connectDb()
    .then(seedUsers)
    .then(disconnectDb)
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
