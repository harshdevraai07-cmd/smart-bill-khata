const { GoogleGenerativeAI } = require('@google/generative-ai');

const scanBill = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `
      You are an expert invoice parser for Indian retail wholesale bills, challans, and handwritten market parchis.
      Extract exactly three fields from this image and output as raw JSON:
      1. "wholesalerName": The seller/vendor/agency issuing the bill. Do not pick the buyer's name (ignore Devda Rakhi or देवड़ा राखी).
      2. "billDate": The date on the bill formatted as "YYYY-MM-DD". If missing or unreadable, use null.
      3. "totalAmount": The final net total payable amount as a pure number without currency signs or commas.

      JSON structure:
      {
        "wholesalerName": "ABC Traders",
        "billDate": "2026-09-15",
        "totalAmount": 4500
      }
    `;

    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString('base64'),
        mimeType: req.file.mimetype
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const parsedData = JSON.parse(result.response.text());

    res.json({ success: true, data: parsedData });
  } catch (error) {
    console.error('AI Extraction Error:', error);
    res.status(500).json({ error: 'Failed to process the bill image' });
  }
};

module.exports = { scanBill };