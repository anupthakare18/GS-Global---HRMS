require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hrms';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB database.'))
    .catch(err => console.error('Error connecting to MongoDB:', err.message));

// Add robust toJSON transform to convert _id to id for the frontend
const toJSONOptions = {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
};

const EmployeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'employee'], required: true },
    department: { type: String },
    created_at: { type: Date, default: Date.now }
}, { toJSON: toJSONOptions });

const AttendanceSchema = new mongoose.Schema({
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: String, required: true },
    punch_in: { type: String },
    punch_out: { type: String }
}, { toJSON: toJSONOptions });

const LeaveSchema = new mongoose.Schema({
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    leave_type: { type: String, required: true },
    start_date: { type: String, required: true },
    end_date: { type: String, required: true },
    reason: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    created_at: { type: Date, default: Date.now }
}, { toJSON: toJSONOptions });

const DailyReportSchema = new mongoose.Schema({
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: String, required: true },
    work_summary: { type: String, required: true },
    notes: { type: String },
    created_at: { type: Date, default: Date.now }
}, { toJSON: toJSONOptions });

const Employee = mongoose.model('Employee', EmployeeSchema);
const Attendance = mongoose.model('Attendance', AttendanceSchema);
const Leave = mongoose.model('Leave', LeaveSchema);
const DailyReport = mongoose.model('DailyReport', DailyReportSchema);

// Seed default admin
Employee.findOne({ role: 'admin' }).then(async (admin) => {
    if (!admin) {
        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            await Employee.create({
                name: 'Admin User',
                email: 'admin@example.com',
                password: hashedPassword,
                role: 'admin',
                department: 'Management'
            });
            console.log('Created default admin: admin@example.com / admin123');
        } catch (err) {
            console.error("Error creating default admin:", err.message);
        }
    }
}).catch(console.error);

module.exports = {
    Employee,
    Attendance,
    Leave,
    DailyReport
};
