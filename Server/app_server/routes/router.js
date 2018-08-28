var express = require('express');
var path = require('path');
var router = express.Router();

const adminController = require('../controllers/admin_controller');
const scriptController = require('../controllers/script_controller');
const xhrController = require('../controllers/xhr_controller');
var cors = require('cors');
var nocache = require('nocache');

/********* Admin Screen ***********/

router.get('/', adminController.getAdminScreen);
router.post('/', adminController.postAdminScreen);
router.get('/status', adminController.getStatus);

/*********  Task JavaScripts  ***********/

router.get('/script', cors(), nocache(), scriptController.getTaskScript);

/********* XHR Task URLs **************/

router.get('/task/session', cors(), xhrController.getSessionID);
router.get('/task/get', cors(), xhrController.taskGet);

let corsOptions = {
  "origin": "*",
  "methods": "POST",
  "preflightContinue": false,
  "optionsSuccessStatus": 204
};

router.options('/task/post', cors(corsOptions));
router.post('/task/post', cors(), xhrController.taskPost);

module.exports = router;
