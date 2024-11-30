'use strict'

const express = require('express');
const accessController = require('../../controllers/access.controller');
const { asyncHandler } = require('../../auth/checkAuth');
const { authentication } = require('../../auth/authUtils');
const router = express.Router();

router.post('/shop/login', asyncHandler(accessController.login))
router.post('/shop/signup', asyncHandler(accessController.singUp))

//authentication
// router.use(authentication);
router.post('/shop/logout', asyncHandler(accessController.logout))
router.post('/shop/refresh-access-token', asyncHandler(accessController.handleRefreshToken))

module.exports = router;