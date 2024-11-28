'use strict'

const ProductService = require('../services/product.service');
const ProductServiceV2 = require('../services/product-v2.service');
const { SuccessResponse } = require('../core/success.response');

class ProductController {
    createProduct = async (req, res, next) => {
        // new SuccessResponse({
        //     message: 'Create new Product success',
        //     metadata: await ProductService.createProduct(req.body.product_type, {
        //         ...req.body,
        //         product_shop: req.user.userId
        //     })
        // }).send(res)

        new SuccessResponse({
            message: 'Create new Product success',
            metadata: await ProductServiceV2.createProduct(req.body.product_type, {
                ...req.body,
                product_shop: req.user.userId
            })
        }).send(res)
    }

    // update product
    updateProduct = async (req, res, next) => {
        new SuccessResponse({
            message: 'Update Product success',
            metadata: await ProductServiceV2.updateProduct(req.body.product_type, req.params.product_id, {
                ...req.body,
                product_shop: req.user.userId
            })
        }).send(res)
    }

    publishProductByShop = async (req, res, next) => {
        new SuccessResponse({
            message: 'Create Publish Product By Shop success',
            metadata: await ProductServiceV2.publishProductByShop({
                product_shop: req.user.userId,
                product_id: req.params.id
            })
        }).send(res)
    }

    unPublishProductByShop = async (req, res, next) => {
        new SuccessResponse({
            message: 'Create Un Publish Product By Shop success',
            metadata: await ProductServiceV2.unPublishProductByShop({
                product_shop: req.user.userId,
                product_id: req.params.id
            })
        }).send(res)
    }

    // QUERY
    getAllDraftsForShop = async (req, res, next) => {
        new SuccessResponse({
            message: 'Create List Draft success',
            metadata: await ProductServiceV2.findAllDraftsForShop({
                product_shop: req.user.userId
            })
        }).send(res)
    }

    getAllPublishForShop = async (req, res, next) => {
        new SuccessResponse({
            message: 'Create new Product success',
            metadata: await ProductServiceV2.findAllPublishForShop({
                product_shop: req.user.userId
            })
        }).send(res)
    }

    getListSearchProduct = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get list search product success',
            metadata: await ProductServiceV2.searchProducts(req.params)
        }).send(res)
    }

    findAllProducts = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get list all product success',
            metadata: await ProductServiceV2.findAllProducts(req.query)
        }).send(res)
    }

    findAllCategories = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get list all categories success',
            metadata: await ProductServiceV2.findAllCategories(req.query)
        }).send(res)
    }

    findProduct = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get list product success',
            metadata: await ProductServiceV2.findProduct({
                product_id: req.params.product_id
            })
        }).send(res)
    }
}

module.exports = new ProductController();