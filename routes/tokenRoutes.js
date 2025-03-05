const express = require('express');
const tokenController = require('../controllers/tokenController');
const { authenticate } = require('../helpers');

const router = express.Router();

// Create a new service ali ovo moras da doradis
// router.post('/save-token',authenticate, tokenController.postToken);
// router.post('/',authenticate, tokenController.postTokenToFCM);
// router.post('/send-notification',authenticate, tokenController.sendNotification);


router.post('/save-token',tokenController.postToken);
router.post('/', tokenController.postTokenToFCM);
router.post('/send-notification', tokenController.sendNotification);

module.exports = router;
