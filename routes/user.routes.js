
const express = require('express');
const router = express.Router();

const { getMe, getAllUsers } = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/me', protect, getMe);
router.get('/', protect, authorize('hr_admin'), getAllUsers);

module.exports = router;
