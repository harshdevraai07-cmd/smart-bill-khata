const express = require('express');
const { createBill } = require('../controllers/ledgerController');

const router = express.Router();

// Route: POST /api/bills
router.post('/bills', createBill);

module.exports = router;