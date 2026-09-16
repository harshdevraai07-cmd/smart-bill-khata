const express = require('express');
const multer = require('multer');
const { scanBill } = require('../controllers/aiController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('billImage'), scanBill);

module.exports = router;