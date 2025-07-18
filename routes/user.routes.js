
const express = require('express');
const router = express.Router();

const { getMe, getAllUsers, deleteUser, updateMe, changePassword } = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/me', protect, getMe);
router.get('/', protect, authorize('hr_admin'), getAllUsers);
router.delete('/:id', protect, authorize('hr_admin'), deleteUser);
router.put('/me', protect, updateMe);
router.put('/me/change-password', protect, changePassword);


module.exports = router;
