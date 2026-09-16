const express = require('express');
const { createBill } = require('../controllers/ledgerController');

const router = express.Router();

// Route: POST /api/bills
router.post('/bills', createBill);

// DELETE a bill by ID
router.delete('/:id', async (req, res) => {
  try {
    // If you have authentication middleware applied to this route, great!
    // Otherwise, this will just delete the bill matching the ID.
    const deletedBill = await Bill.findByIdAndDelete(req.params.id);
    
    if (!deletedBill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    res.json({ success: true, message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete bill' });
  }
});
module.exports = router;