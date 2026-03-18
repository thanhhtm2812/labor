const path = require('path');
// Cấu hình đường dẫn tuyệt đối đến file .env nằm ở thư mục server/
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const createAdmin = async () => {
    try {
        // 1. Kết nối Database
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Đã kết nối MongoDB...');

        // 2. Kiểm tra xem Admin đã tồn tại chưa
        const adminExists = await User.findOne({ email: 'admin@laborconnect.vn' });
        if (adminExists) {
            console.log('⚠️ Tài khoản Admin đã tồn tại!');
            process.exit();
        }

        // 3. Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash('Admin@123', salt);

        // 4. Tạo Admin mới
        const admin = new User({
            fullName: "Hệ thống Admin",
            email: "admin@laborconnect.vn",
            password: hashedPassword,
            role: "admin",
            isActive: true
        });

        await admin.save();
        console.log('🚀 Đã tạo tài khoản Admin thành công!');
        console.log('Email: admin@laborconnect.vn | Pass: Admin@123');
        
        process.exit();
    } catch (error) {
        console.error('❌ Lỗi tạo Admin:', error);
        process.exit(1);
    }
};

createAdmin();