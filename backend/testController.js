const aiController = require('./src/controllers/aiController');

const req = { query: {} };
const res = { 
  json: (data) => console.log('Success:', data),
  status: (code) => { console.log('Status:', code); return { json: (d) => console.log('Error:', d) }; }
};

aiController.getIcebreaker(req, res).catch(console.error);
