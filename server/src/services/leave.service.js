const LeaveRequest = require('../models/LeaveRequest');
const Attendance = require('../models/Attendance');
const { ApiError } = require('../middleware/errorHandler');
const { startOfDayUTC, eachDayUTC } = require('../utils/dates');
const { notify, notifyAdmins } = require('./notification.service');

const MAX_RANGE_DAYS = 60;

async function create(userId, { type, startDate, endDate, remarks }) {
  const start = startOfDayUTC(startDate);
  const end = startOfDayUTC(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new ApiError(400, 'Invalid date range');
  }
  if (start > end) throw new ApiError(400, 'Start date must be on or before the end date');
  if (eachDayUTC(start, end).length > MAX_RANGE_DAYS) {
    throw new ApiError(400, `A single request may cover at most ${MAX_RANGE_DAYS} days`);
  }

  const overlap = await LeaveRequest.findOne({
    user: userId,
    status: { $in: ['pending', 'approved'] },
    startDate: { $lte: end },
    endDate: { $gte: start },
  }).lean();
  if (overlap) {
    throw new ApiError(409, 'You already have a pending or approved leave overlapping these dates');
  }

  const request = await LeaveRequest.create({
    user: userId,
    type,
    startDate: start,
    endDate: end,
    remarks,
  });

  await notifyAdmins({
    message: `New ${type} leave request (${start.toISOString().slice(0, 10)} → ${end
      .toISOString()
      .slice(0, 10)})`,
    type: 'leave',
    link: '/admin/leaves',
  });

  return request.toObject();
}

async function listOwn(userId, { from, to }) {
  const filter = { user: userId };
  if (from && to) {
    filter.startDate = { $lte: startOfDayUTC(to) };
    filter.endDate = { $gte: startOfDayUTC(from) };
  }
  return LeaveRequest.find(filter).sort({ startDate: -1 }).limit(100).lean();
}

async function cancelOwn(userId, requestId) {
  const request = await LeaveRequest.findOne({ _id: requestId, user: userId });
  if (!request) throw new ApiError(404, 'Leave request not found');
  if (request.status !== 'pending') {
    throw new ApiError(409, 'Only pending requests can be cancelled');
  }
  await request.deleteOne();
}

async function adminList({ status, page = 1, limit = 15 }) {
  const filter = {};
  if (status) filter.status = status;
  const [requests, total] = await Promise.all([
    LeaveRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('user', 'employeeId email')
      .populate('reviewedBy', 'employeeId email')
      .lean(),
    LeaveRequest.countDocuments(filter),
  ]);
  return { requests, total, page: Number(page), pages: Math.ceil(total / limit) || 1 };
}

// Approval is the single source of truth for leave days: it writes 'leave'
// attendance records for the whole range so calendars and history agree.
async function decide(adminId, requestId, { status, adminComment = '' }) {
  const request = await LeaveRequest.findById(requestId);
  if (!request) throw new ApiError(404, 'Leave request not found');
  if (request.status !== 'pending') {
    throw new ApiError(409, `This request was already ${request.status}`);
  }

  request.status = status;
  request.adminComment = adminComment;
  request.reviewedBy = adminId;
  request.reviewedAt = new Date();
  await request.save();

  if (status === 'approved') {
    const days = eachDayUTC(request.startDate, request.endDate);
    await Attendance.bulkWrite(
      days.map((day) => ({
        updateOne: {
          filter: { user: request.user, date: day },
          update: {
            $set: { status: 'leave' },
            $setOnInsert: { user: request.user, date: day },
          },
          upsert: true,
        },
      }))
    );
  }

  await notify(request.user, {
    message: `Your leave request (${request.startDate.toISOString().slice(0, 10)} → ${request.endDate
      .toISOString()
      .slice(0, 10)}) was ${status}${adminComment ? `: "${adminComment}"` : ''}`,
    type: 'leave',
    link: '/app/leave',
  });

  return LeaveRequest.findById(requestId)
    .populate('user', 'employeeId email')
    .populate('reviewedBy', 'employeeId email')
    .lean();
}

module.exports = { create, listOwn, cancelOwn, adminList, decide };
