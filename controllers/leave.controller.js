
const LeaveRequest = require('../models/leaveRequest.model');
const User = require('../models/user.model');

const createLeaveRequest = async (req, res) => {
    try {
        const { startDate, endDate, reason } = req.body;
        if (!startDate || !endDate || !reason) {
            return res.status(400).json({ message: 'Lütfen tüm zorunlu alanları doldurun: startDate, endDate, reason.' });
        }
        const leaveRequest = await LeaveRequest.create({
            employee: req.user.id,
            startDate,
            endDate,
            reason,
        });
        res.status(201).json({ message: 'İzin talebi başarıyla oluşturuldu.', data: leaveRequest });
    } catch (error) {
        res.status(500).json({ message: 'Sunucuda bir hata oluştu.', error: error.message });
    }
};

const getLeaveRequests = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'employee') {
            query = { employee: req.user.id };
        }
        else if (req.user.role === 'manager') {
            const teamMembers = await User.find({ manager: req.user.id });
            const teamMemberIds = teamMembers.map(member => member._id);
            query = { employee: { $in: teamMemberIds } };
        }

const leaveRequests = await LeaveRequest.find(query);

    res.status(200).json({
        message: "İzin talepleri başarıyla getirildi (basit mod).",
        count: leaveRequests.length,
        data: leaveRequests,
    });

    } catch (error) {
        res.status(500).json({ message: 'Sunucuda bir hata oluştu.', error: error.message });
    }
};

const updateLeaveStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: "Geçersiz durum. Durum sadece 'approved' veya 'rejected' olabilir." });
        }

        const leaveRequest = await LeaveRequest.findById(id);

        if (!leaveRequest) {
            return res.status(404).json({ message: 'Bu ID ile bir izin talebi bulunamadı.' });
        }

        leaveRequest.status = status;
        await leaveRequest.save();

        res.status(200).json({
            message: 'İzin talebi durumu başarıyla güncellendi.',
            data: leaveRequest
        });

    } catch (error) {
        res.status(500).json({ message: 'Sunucuda bir hata oluştu.', error: error.message });
    }
};

module.exports = {
    createLeaveRequest,
    getLeaveRequests,
    updateLeaveStatus,
};
