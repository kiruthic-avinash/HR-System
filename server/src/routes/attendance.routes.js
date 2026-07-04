const router = require('express').Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const validate = require('../middleware/validate');
const attendanceService = require('../services/attendance.service');

const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);

router.use(auth);

// Employee: identity always taken from the verified JWT, never from params.
router.post(
  '/check-in',
  wrap(async (req, res) => {
    const record = await attendanceService.checkIn(req.user.id);
    res.status(201).json({ record });
  })
);

router.post(
  '/check-out',
  wrap(async (req, res) => {
    const record = await attendanceService.checkOut(req.user.id);
    res.json({ record });
  })
);

router.get(
  '/me',
  wrap(async (req, res) => {
    const records = await attendanceService.listOwn(req.user.id, req.query);
    res.json({ records });
  })
);

// Admin: workforce-wide visibility and corrections.
router.get(
  '/',
  rbac('admin'),
  wrap(async (req, res) => {
    const result = await attendanceService.adminList(req.query);
    res.json(result);
  })
);

router.post(
  '/mark-absentees',
  rbac('admin'),
  wrap(async (req, res) => {
    const result = await attendanceService.markAbsentees(req.body.date || new Date());
    res.json(result);
  })
);

router.patch(
  '/:id',
  rbac('admin'),
  validate([
    body('status').optional().isIn(['present', 'absent', 'half-day', 'leave']),
  ]),
  wrap(async (req, res) => {
    const record = await attendanceService.adminUpdate(req.params.id, req.body);
    res.json({ record });
  })
);

module.exports = router;
