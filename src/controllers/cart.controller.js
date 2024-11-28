"use strict";

const CartService = require('../services/cart.service');
const { SuccessResponse } = require('../core/success.response');

class CartController {
    addToCart = async (req, res, next) => {
        new SuccessResponse({
            message: 'Create new Cart Success',
            metadata: await CartService.addToCart(req.body)
        }).send(res)
    }

    updateCart = async (req, res, next) => {
        // new 
        new SuccessResponse({
            message: 'Update Cart Success',
            metadata: await CartService.addToCartV2(req.body)
        }).send(res)
    }

    deleteCart = async (req, res, next) => {
        new SuccessResponse({
            message: 'Delete Cart Success',
            metadata: await CartService.deleteUserCart(req.body)
        }).send(res)
    }

    listToCart = async (req, res, next) => {
        // console.log('keyStore', req.keyStore)
        const cart_userId = req.headers['x-client-id']
        new SuccessResponse({
            message: 'List Cart Success',
            metadata: await CartService.getListUserCart({query: req.query, cart_userId})
        }).send(res)
    }
}

module.exports = new CartController()