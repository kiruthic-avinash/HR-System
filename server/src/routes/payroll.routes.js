const router = require('express').Router();
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const payrollService = require('../services/payroll.service');

const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);

router.use(auth);

// Employee: read-only. No POST/PUT/PATCH exists on this path for employees.
router.get(
  '/me',
  wrap(async (req, res) => {
    const salary = await payrollService.getOwn(req.user.id);
    res.json({ salary });
  })
);

// Admin: full read/write over all payroll data.
router.get(
  '/',
  rbac('admin'),
  wrap(async (req, res) => {
    const result = await payrollService.adminList(req.query);
    res.json(result);
  })
);

router.get(
  '/:userId',
  rbac('admin'),
  wrap(async (req, res) => {
    const result = await payrollService.adminGet(req.params.userId);
    res.json(result);
  })
);

router.put(
  '/:userId',
  rbac('admin'),
  wrap(async (req, res) => {
    const salary = await payrollService.adminUpdate(req.params.userId, req.body);
    res.json({ salary });
  })
);

module.exports = router;
