'use strict'

const express = require('express');
const router = express.Router();
const cartController = require('../../controllers/cart.controller');
const { asyncHandler } = require('../../auth/checkAuth');
const { authentication } = require('../../auth/authUtils');

router.use(authentication);

router.post('/add-to-cart', asyncHandler(cartController.addToCart))
router.delete('', asyncHandler(cartController.deleteCart))
router.post('/update', asyncHandler(cartController.updateCart))
router.get('', asyncHandler(cartController.listToCart))



module.exports = router;