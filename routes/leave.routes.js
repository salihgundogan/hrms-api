
const express = require('express');
const router = express.Router();

const { createLeaveRequest, getLeaveRequests, updateLeaveStatus } = require('../controllers/leave.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/', protect, createLeaveRequest);
router.get('/', protect, getLeaveRequests);
router.put('/:id/status', protect, authorize('manager', 'hr_admin'), updateLeaveStatus);

module.exports = router;
