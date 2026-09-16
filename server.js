require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User'); // Import the new User model

// Model Imports
const Wholesaler = require('./models/Wholesaler');
const Bill = require('./models/Bill');
const Payment = require('./models/Payment');

// Route Imports
const scanRoutes = require('./routes/scanRoutes');
const billRoutes = require('./routes/billRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const ledgerController = require('./controllers/ledgerController');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connect Database
connectDB();

// API Endpoints
app.use('/api/scan-bill', scanRoutes);
app.use('/api', billRoutes);       
app.use('/api', paymentRoutes);    

// Wholesalers & Dashboard Endpoints
app.get('/api/wholesalers', ledgerController.getWholesalers);
app.get('/api/wholesalers/:id/ledger', ledgerController.getLedgerHistory);

// Get Dashboard Stats & Unified Recent Activity (with Debug logs)
app.get('/api/dashboard', async (req, res) => {
  try {
    const wholesalers = await Wholesaler.find();
    const totalMarketDebt = wholesalers.reduce((sum, w) => sum + (w.currentBalanceDue || 0), 0);

    const bills = await Bill.find().populate('wholesalerId').sort({ _id: -1 }).lean().limit(20);
    const payments = await Payment.find().populate('wholesalerId').sort({ _id: -1 }).lean().limit(20);

    // DEBUG: Check your terminal to see what bills are being fetched!
    console.log(`[DEBUG Dashboard] Found ${bills.length} bills and ${payments.length} payments in DB.`);

    const combinedActivity = [
      ...bills.map(b => {
        let name = 'Unknown Supplier';
        if (b.wholesalerId && typeof b.wholesalerId === 'object' && b.wholesalerId.name) {
          name = b.wholesalerId.name;
        } else if (b.wholesalerName) {
          name = b.wholesalerName;
        }

        return {
          type: 'BILL',
          wholesalerName: name,
          date: b.billDate || b.date || b.createdAt || new Date(),
          amount: b.totalAmount || b.amount || 0
        };
      }),
      ...payments.map(p => {
        let name = 'UnknownSupplier';
        if (p.wholesalerId && typeof p.wholesalerId === 'object' && p.wholesalerId.name) {
          name = p.wholesalerId.name;
        } else if (p.wholesalerName) {
          name = p.wholesalerName;
        }

        return {
          type: 'PAYMENT',
          wholesalerName: name,
          date: p.date || p.createdAt || new Date(),
          amount: p.amountPaid || p.amount || 0
        };
      })
    ];

    combinedActivity.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentActivity = combinedActivity.slice(0, 6);

    res.json({ totalMarketDebt, recentActivity });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

// Get stats for a specific month
app.get('/api/monthly-stats', async (req, res) => {
  try {
    const { month } = req.query; 
    if (!month) return res.status(400).json({ error: 'Month is required' });

    const [year, monthNum] = month.split('-');
    
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59);

    const bills = await Bill.find({ 
      $or: [
        { billDate: { $gte: startDate, $lte: endDate } },
        { createdAt: { $gte: startDate, $lte: endDate } }
      ]
    });
    
    const payments = await Payment.find({ 
      $or: [
        { date: { $gte: startDate, $lte: endDate } },
        { createdAt: { $gte: startDate, $lte: endDate } }
      ]
    });

    const monthlyInward = bills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
    const monthlyPaid = payments.reduce((sum, pay) => sum + (pay.amountPaid || pay.amount || 0), 0);

    res.json({ monthlyInward, monthlyPaid });
  } catch (error) {
    console.error("Monthly stats error:", error);
    res.status(500).json({ error: 'Failed to fetch monthly stats' });
  }
});

// --- AUTHENTICATION ROUTES ---

// 1. Signup Route
app.post('/api/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: 'Username already taken.' });

    // Encrypt the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Save to database
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    // Create login token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET || 'supersecretkey', { expiresIn: '30d' });
    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ error: 'Signup failed.' });
  }
});

// 2. Login Route
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find the user
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'User not found.' });

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Incorrect password.' });

    // Create login token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'supersecretkey', { expiresIn: '30d' });
    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ error: 'Login failed.' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));