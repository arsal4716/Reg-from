const express = require('express');
const router = express.Router();

const {
  createForm,
  checkFormByPhone,
  getFieldsByPublisherAndCampaign,
  prefillFormData
} = require('../controllers/formController');

const { verifyToken } = require('../middleware/authMiddleware');

router.get("/fields", getFieldsByPublisherAndCampaign);
router.get("/prefill", prefillFormData);

router.post('/', verifyToken, createForm);
router.get('/check', checkFormByPhone);

module.exports = router;
