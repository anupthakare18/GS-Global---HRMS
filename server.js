require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');

const { Employee, Attendance, Leave, DailyReport } = require('./database');

const app = express();


// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ----------------------------------------------------
// Authentication
// ----------------------------------------------------
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await Employee.findOne({ email });

        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const isMatch = bcrypt.compareSync(password, user.password);
        if (isMatch || password === user.password) {
            res.json({ message: 'Login successful', user: { id: user.id, name: user.name, role: user.role, email: user.email, department: user.department } });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------------------------------
// Employee Management (Admin)
// ----------------------------------------------------
app.get('/api/employees', async (req, res) => {
    try {
        const employees = await Employee.find().select('-password').sort({ created_at: -1 });
        res.json(employees);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/employees', async (req, res) => {
    try {
        const { name, email, password, role, department } = req.body;
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);

        const newEmployee = await Employee.create({
            name, email, password: hash, role, department
        });

        res.status(201).json({ id: newEmployee.id, message: 'Employee created successfully' });
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ error: 'Email already exists' });
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/employees/:id', async (req, res) => {
    try {
        await Employee.findByIdAndDelete(req.params.id);
        res.json({ message: 'Employee deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/employees/:id', async (req, res) => {
    try {
        const { name, department, role } = req.body;
        await Employee.findByIdAndUpdate(req.params.id, { name, department, role });
        res.json({ message: 'Employee updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------------------------------
// Attendance
// ----------------------------------------------------
app.post('/api/attendance/punch-in', async (req, res) => {
    try {
        const { employee_id, date, time } = req.body;
        const existing = await Attendance.findOne({ employee_id, date });

        if (existing) return res.status(400).json({ error: 'Already punched in today' });

        await Attendance.create({ employee_id, date, punch_in: time });
        res.status(201).json({ message: 'Punched in successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/attendance/punch-out', async (req, res) => {
    try {
        const { employee_id, date, time } = req.body;
        const record = await Attendance.findOne({ employee_id, date });

        if (!record || record.punch_out) return res.status(400).json({ error: 'No punch-in found or already punched out' });

        record.punch_out = time;
        await record.save();
        res.json({ message: 'Punched out successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/attendance/:employee_id', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const record = await Attendance.findOne({ employee_id: req.params.employee_id, date: today });
        res.json(record || { status: 'Not punched in' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/attendance', async (req, res) => {
    try {
        const { date } = req.query;
        let query = {};
        if (date) query.date = date;

        const records = await Attendance.find(query)
            .populate('employee_id', 'name')
            .sort({ date: -1 });

        // Map to flat object expected by frontend
        const flatRecords = records.map(r => ({
            id: r.id,
            employee_id: r.employee_id?._id,
            name: r.employee_id?.name || 'Unknown',
            date: r.date,
            punch_in: r.punch_in,
            punch_out: r.punch_out
        }));

        res.json(flatRecords);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------------------------------
// Leaves
// ----------------------------------------------------
app.post('/api/leaves/apply', async (req, res) => {
    try {
        const { employee_id, leave_type, start_date, end_date, reason } = req.body;
        await Leave.create({ employee_id, leave_type, start_date, end_date, reason });
        res.status(201).json({ message: 'Leave applied successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/leaves/history/:employee_id', async (req, res) => {
    try {
        const leaves = await Leave.find({ employee_id: req.params.employee_id }).sort({ created_at: -1 });
        res.json(leaves);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/leaves', async (req, res) => {
    try {
        const leaves = await Leave.find()
            .populate('employee_id', 'name')
            .sort({ created_at: -1 });

        const flatLeaves = leaves.map(l => ({
            id: l.id,
            employee_id: l.employee_id?._id,
            name: l.employee_id?.name || 'Unknown',
            leave_type: l.leave_type,
            start_date: l.start_date,
            end_date: l.end_date,
            reason: l.reason,
            status: l.status,
            created_at: l.created_at
        }));

        res.json(flatLeaves);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/leaves/:id', async (req, res) => {
    try {
        const { status } = req.body;
        await Leave.findByIdAndUpdate(req.params.id, { status });
        res.json({ message: `Leave ${status}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------------------------------
// Daily Reports
// ----------------------------------------------------
app.post('/api/reports/submit', async (req, res) => {
    try {
        const { employee_id, date, work_summary, notes } = req.body;
        await DailyReport.create({ employee_id, date, work_summary, notes });
        res.status(201).json({ message: 'Report submitted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/reports', async (req, res) => {
    try {
        const { date } = req.query;
        let query = {};
        if (date) query.date = date;

        const reports = await DailyReport.find(query)
            .populate('employee_id', 'name')
            .sort({ date: -1 });

        const flatReports = reports.map(r => ({
            id: r.id,
            employee_id: r.employee_id?._id,
            name: r.employee_id?.name || 'Unknown',
            date: r.date,
            work_summary: r.work_summary,
            notes: r.notes,
            created_at: r.created_at
        }));

        res.json(flatReports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------------------------------
// Export
// ----------------------------------------------------
app.get('/api/export/:type', async (req, res) => {
    try {
        const type = req.params.type;
        let rows = [];
        let filename = '';

        if (type === 'attendance') {
            const records = await Attendance.find().populate('employee_id', 'name');
            rows = records.map(r => ({
                date: r.date,
                name: r.employee_id?.name || 'Unknown',
                punch_in: r.punch_in,
                punch_out: r.punch_out
            }));
            filename = 'attendance_report.xlsx';
        } else if (type === 'leaves') {
            const leaves = await Leave.find().populate('employee_id', 'name');
            rows = leaves.map(l => ({
                name: l.employee_id?.name || 'Unknown',
                leave_type: l.leave_type,
                start_date: l.start_date,
                end_date: l.end_date,
                status: l.status,
                reason: l.reason
            }));
            filename = 'leave_report.xlsx';
        } else if (type === 'reports') {
            const reports = await DailyReport.find().populate('employee_id', 'name');
            rows = reports.map(r => ({
                date: r.date,
                name: r.employee_id?.name || 'Unknown',
                work_summary: r.work_summary,
                notes: r.notes
            }));
            filename = 'work_reports.xlsx';
        } else {
            return res.status(400).json({ error: 'Invalid export type' });
        }

        // Create a new workbook
        const wb = xlsx.utils.book_new();
        // Convert data to a worksheet
        const ws = xlsx.utils.json_to_sheet(rows);
        // Append the worksheet to the workbook
        xlsx.utils.book_append_sheet(wb, ws, "Sheet1");
        // Write the workbook to a buffer
        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Set headers for file download
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);

    } catch (error) {
        res.status(500).json({ error: 'Failed to generate Excel file' });
    }
});

// Admin Dashboard Stats
app.get('/api/admin/dashboard-stats', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const [totalEmployees, todayAttendance, pendingLeaves, submittedReports] = await Promise.all([
            Employee.countDocuments({ role: 'employee' }),
            Attendance.countDocuments({ date: today }),
            Leave.countDocuments({ status: 'pending' }),
            DailyReport.countDocuments({ date: today })
        ]);

        res.json({
            totalEmployees,
            todayAttendance,
            pendingLeaves,
            submittedReports
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fallback to index.html for SPA if needed
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
