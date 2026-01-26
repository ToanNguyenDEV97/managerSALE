// server/routes/organization.routes.js
const express = require('express');
const router = express.Router();
const { 
    getOrganization, 
    updateOrganization,
    getMe,
} = require('../controllers/organization.controller');

// Các route này đã được bọc middleware 'protect' ở server.js
// nên không cần khai báo lại ở đây nếu muốn gọn.
// Đường dẫn gốc ở đây tương ứng với '/'

router.get('/', getOrganization);
router.put('/', updateOrganization);
router.get('/me', getMe);

module.exports = router;