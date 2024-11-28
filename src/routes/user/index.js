'use strict'

const express = require('express');
const { asyncHandler } = require('../../auth/checkAuth');
const { authentication } = require('../../auth/authUtils');
const { newUser, checkRegisterEmailToken } = require('../../controllers/user.controller');
const router = express.Router();

router.post('/new_user', asyncHandler(newUser))
router.get('/welcome-back', asyncHandler(checkRegisterEmailToken))

module.exports = router;