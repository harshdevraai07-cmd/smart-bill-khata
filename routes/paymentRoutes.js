const express = require('express');
const { createPayment } = require('../controllers/ledgerController');

const router = express.Router();

// Route: POST /api/payments
router.post('/payments', createPayment);

module.exports = router;