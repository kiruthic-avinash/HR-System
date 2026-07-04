const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { ApiError } = require('../middleware/errorHandler');
const { startOfDayUTC } = require('../utils/dates');

const HALF_DAY_THRESHOLD_HOURS = 4;

async function checkIn(userId) {
  const today = startOfDayUTC(new Date());
  const now = new Date();
  let previous;
  try {
    // Atomic upsert: under concurrent double-clicks either the $setOnInsert
    // wins exactly once or the unique {user,date} index raises E11000.
    previous = await Attendance.findOneAndUpdate(
      { user: userId, date: today },
      { $setOnInsert: { checkIn: now, status: 'present' } },
      { upsert: true, new: false }
    );
  } catch (err) {
    if (err.code === 11000) throw new ApiError(409, 'You have already checked in today');
    throw err;
  }
  if (previous) {
    if (previous.status === 'leave') throw new ApiError(409, 'You are on approved leave today');
    throw new ApiError(409, 'You have already checked in today');
  }
  return Attendance.findOne({ user: userId, date: today }).lean();
}

async function checkOut(userId) {
  const today = startOfDayUTC(new Date());
  const record = await Attendance.findOne({ user: userId, date: today });
  if (!record || !record.checkIn) throw new ApiError(400, 'Check in before checking out');
  if (record.checkOut) throw new ApiError(409, 'You have already checked out today');

  record.checkOut = new Date();
  record.workHours = Math.round(((record.checkOut - record.checkIn) / 36e5) * 100) / 100;
  record.status = record.workHours < HALF_DAY_THRESHOLD_HOURS ? 'half-day' : 'present';
  await record.save();
  return record.toObject();
}

// Employees can only ever see their own records: userId comes from the JWT.
async function listOwn(userId, { from, to }) {
  const filter = { user: userId };
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = startOfDayUTC(from);
    if (to) filter.date.$lte = startOfDayUTC(to);
  }
  return Attendance.find(filter).sort({ date: -1 }).limit(100).lean();
}

async function adminList({ from, to, userId, status, page = 1, limit = 20 }) {
  const filter = {};
  if (userId) filter.user = userId;
  if (status) filter.status = status;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = startOfDayUTC(from);
    if (to) filter.date.$lte = startOfDayUTC(to);
  }
  const [records, total] = await Promise.all([
    Attendance.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('user', 'employeeId email')
      .lean(),
    Attendance.countDocuments(filter),
  ]);
  return { records, total, page: Number(page), pages: Math.ceil(total / limit) || 1 };
}

async function adminUpdate(id, { status, checkIn, checkOut }) {
  const record = await Attendance.findById(id);
  if (!record) throw new ApiError(404, 'Attendance record not found');
  if (checkIn !== undefined) record.checkIn = checkIn ? new Date(checkIn) : null;
  if (checkOut !== undefined) record.checkOut = checkOut ? new Date(checkOut) : null;
  if (record.checkIn && record.checkOut) {
    record.workHours = Math.round(((record.checkOut - record.checkIn) / 36e5) * 100) / 100;
  }
  if (status) record.status = status;
  await record.save();
  return record.toObject();
}

// End-of-day sweep: everyone without a record for the day (present, leave or
// otherwise) gets a single bulk-inserted 'absent' row.
async function markAbsentees(forDate = new Date()) {
  const day = startOfDayUTC(forDate);
  const [allUsers, recorded] = await Promise.all([
    User.find().select('_id').lean(),
    Attendance.find({ date: day }).select('user').lean(),
  ]);
  const recordedSet = new Set(recorded.map((r) => r.user.toString()));
  const missing = allUsers.filter((u) => !recordedSet.has(u._id.toString()));
  if (!missing.length) return { marked: 0, date: day };
  await Attendance.insertMany(
    missing.map((u) => ({ user: u._id, date: day, status: 'absent' })),
    { ordered: false }
  );
  return { marked: missing.length, date: day };
}

module.exports = { checkIn, checkOut, listOwn, adminList, adminUpdate, markAbsentees };
