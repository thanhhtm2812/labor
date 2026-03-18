const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') }); // Nạp cấu hình từ file .env 
const mongoose = require('mongoose');
const User = require('../models/User');

const deleteUser = async (email) => {
    try {
        await mongoose.connect(process.env.MONGO_URI); // Kết nối dùng URI từ .env 
        
        const result = await User.deleteOne({ email: email });
        
        if (result.deletedCount > 0) {
            console.log(`✅ Đã xóa thành công tài khoản: ${email}`);
        } else {
            console.log(`⚠️ Không tìm thấy tài khoản với email: ${email}`);
        }
        
        process.exit();
    } catch (error) {
        console.error('❌ Lỗi khi xóa:', error);
        process.exit(1);
    }
};

// Truyền email cần xóa vào đây
deleteUser('admin@laborconnect.vn');