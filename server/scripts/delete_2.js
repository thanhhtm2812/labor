const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Application = require('../models/Application');

const deleteApp = async (id) => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const result = await Application.deleteOne({ _id: id });
        
        if (result.deletedCount > 0) {
            console.log(`✅ Đã xóa thành công Application ID: ${id}`);
        } else {
            console.log(`⚠️ Không tìm thấy Application với ID: ${id}`);
        }
        
        process.exit();
    } catch (error) {
        console.error('❌ Lỗi khi xóa:', error);
        process.exit(1);
    }
};

deleteApp('69b9b0c8a10451d1db26f893');