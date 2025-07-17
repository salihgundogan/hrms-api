// controllers/leave.controller.js

const db = require('../models');
const LeaveRequest = db.LeaveRequest;
// === YENİ EKLENEN VE EKSİK OLAN SATIR ===
// User modelini de çağırıyoruz, çünkü onu 'deleteLeaveRequest' içinde kullanacağız.
const User = db.User;

const createLeaveRequest = async (req, res) => {
    try {
        const { startDate, endDate, reason } = req.body;
        if (!startDate || !endDate || !reason) {
            return res.status(400).json({ message: 'Lütfen tüm zorunlu alanları doldurun.' });
        }
        const leaveRequest = await LeaveRequest.create({
            employeeId: req.user.id,
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
        let options = {
            include: [{
                model: User,
                as: 'employee',
                attributes: ['name', 'email']
            }],
            where: {}
        };

        if (req.user.role === 'employee') {
            options.where.employeeId = req.user.id;
        } else if (req.user.role === 'manager') {
            const teamMembers = await User.findAll({ where: { managerId: req.user.id } });
            const teamMemberIds = teamMembers.map(member => member.id);
            options.where.employeeId = { [db.Sequelize.Op.in]: teamMemberIds };
        }
        
        const leaveRequests = await LeaveRequest.findAll(options);
        res.status(200).json({
            message: "İzin talepleri başarıyla getirildi.",
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
        const manager = req.user;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: "Geçersiz durum. Durum sadece 'approved' veya 'rejected' olabilir." });
        }

        const leaveRequest = await LeaveRequest.findByPk(id, {
            include: [{
                model: User,
                as: 'employee',
                attributes: ['id', 'name', 'managerId']
            }]
        });

        if (!leaveRequest) {
            return res.status(404).json({ message: 'Bu ID ile bir izin talebi bulunamadı.' });
        }

        if (manager.role === 'manager' && leaveRequest.employee.managerId !== manager.id) {
            return res.status(403).json({ message: 'Sadece kendi çalışanlarınızın izin taleplerini yönetebilirsiniz.' });
        }

        leaveRequest.status = status;
        await leaveRequest.save();

        res.status(200).json({
            message: 'İzin talebi durumu başarıyla güncellendi.',
            data: leaveRequest
        });
    } catch (error) {
        console.error('Update Leave Status Error:', error);
        res.status(500).json({ message: 'Sunucuda bir hata oluştu.', error: error.message });
    }
};

const deleteLeaveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = req.user;

        const leaveRequest = await LeaveRequest.findByPk(id);

        if (!leaveRequest) {
            return res.status(404).json({ message: 'Bu ID ile bir izin talebi bulunamadı.' });
        }

        if (currentUser.role === 'manager') {
            // DÜZELTME: Bu kontrol için 'User' modeline ihtiyacımız vardı.
            const employee = await User.findByPk(leaveRequest.employeeId);
            if (!employee || employee.managerId !== currentUser.id) {
                return res.status(403).json({ message: 'Sadece kendi çalışanlarınızın izin taleplerini silebilirsiniz.' });
            }
        }

        await leaveRequest.destroy();
        res.status(204).send();

    } catch (error) {
        console.error('Delete Leave Request Error:', error);
        res.status(500).json({ message: 'İzin talebi silinirken bir hata oluştu.' });
    }
};

module.exports = {
    createLeaveRequest,
    getLeaveRequests,
    updateLeaveStatus,
    deleteLeaveRequest
};
