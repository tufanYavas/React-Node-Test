const express = require('express');
const { add, index, view, deleteData, deleteMany } = require('./meeting');
const auth = require('../../middelwares/auth');

const router = express.Router();

// Use auth for all routes
router.use(auth);

// Meeting routes
router.post('/', add);
router.get('/', index);
router.get('/view/:id', view);
router.delete('/delete/:id', deleteData);
router.post('/deleteMany', deleteMany);

module.exports = router