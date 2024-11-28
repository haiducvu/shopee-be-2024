'use strict'

const { Types } = require("mongoose");
const { product, clothing, electronics, furniture } = require('../models/product.model');
const { BadRequestError } = require("../core/error.response");
const { findAllDraftsForShop, findAllPublishForShop, publishProductByShop, unPublishProductByShop, searchProduct, findAllProducts, findAllCategories, findProduct, updateProductId } = require("../models/repositories/product.repo");
const { removeUndefinedObject, updateNestedObjectParser } = require('../utils');
const { insertInventory } = require('../models/repositories/inventory.repo');
const { pushNotifyToSystem } = require("./notification.service");

// define Factory class to create product
class ProductFactory {

    static productRegistry = {}

    static registerProductType(type, classRef) {
        ProductFactory.productRegistry[type] = classRef
    }

    static async createProduct(type, payload) {
        const productClass = ProductFactory.productRegistry[type]
        if (!productClass) throw new BadRequestError(`Invalid Product Types ${type}`);

        return new productClass(payload).createProduct()
    }

    static async updateProduct(type, product_id, payload) {
        const productClass = ProductFactory.productRegistry[type]
        if (!productClass) throw new BadRequestError(`Invalid Product Types ${type}`);

        return new productClass(payload).updateProduct(product_id)
    }

    static async publishProductByShop({ product_shop, product_id }) {
        return await publishProductByShop({ product_shop, product_id })
    }

    static async unPublishProductByShop({ product_shop, product_id }) {
        return await unPublishProductByShop({ product_shop, product_id })
    }

    static async findAllDraftsForShop({ product_shop, limit = 50, skip = 0 }) {
        const query = { product_shop, isDraft: true }
        return await findAllDraftsForShop({ query, limit, skip })
    }

    static async findAllPublishForShop({ product_shop, limit = 50, skip = 0 }) {
        const query = { product_shop, isPublished: true }
        return await findAllPublishForShop({ query, limit, skip })
    }

    static async searchProducts({ keySearch }) {
        return await searchProduct({ keySearch })
    }

    static async findAllProducts({ limit = 20, category, sort = 'ctime', page = 1, filter = { isPublished: true } }) {
        return await findAllProducts(({ limit, category, sort, page, filter, select: ['product_shop', 'product_name', 'product_price', 'product_thumb', 'product_shop', 'product_type'] }))
    }

    static async findAllCategories() {
        return await findAllCategories()
    }

    static async findProduct({ product_id }) {
        return await findProduct({ product_id, unSelect: ['__v'] })
    }
}

// define base product class
class Product {
    constructor({
        product_name, product_thumb, product_description, product_price,
        product_type, product_shop, product_attributes, product_quantity
    }) {
        this.product_name = product_name
        this.product_thumb = product_thumb
        this.product_description = product_description
        this.product_price = product_price
        this.product_shop = product_shop
        this.product_attributes = product_attributes
        this.product_quantity = product_quantity
        this.product_type = product_type
    }

    // create new product
    async createProduct(product_id) {
        const newProduct = await product.create({ ...this, _id: product_id })
        if (newProduct) {
            // add product_stock inventory collection
            const invenData = await insertInventory({
                productId: new Types.ObjectId(newProduct._id),
                shopId: this.product_shop,
                stock: this.product_quantity
            })

            // push notify to system collection
            pushNotifyToSystem({
                type: 'SHOP-001',
                receivedId: 1,
                senderId: this.product_shop,
                options: {
                    product_name: this.product_name,
                    shop_name: this.product_shop
                }
            }).then(rs => console.log('rsSSS', rs))
                .catch(error => console.log('errorRRR', error))
            console.log('invenData', invenData)
        }
        return newProduct
    }

    // update product
    async updateProduct(product_id, bodyUpdate) {
        return await updateProductId({ product_id, bodyUpdate, model: product })
    }
}

// define sub-class for different product types Clothing
class Clothing extends Product {
    async createProduct() {
        const newClothing = await clothing.create(({
            ...this.product_attributes,
            product_shop: this.product_shop,
            type: this.product_type
        }))
        if (!newClothing) throw new BadRequestError('create new Clothing error');
        const newProduct = await super.createProduct(newClothing._id);
        if (!newProduct) throw new BadRequestError('create new Product error');

        return newProduct;
    }

    async updateProduct(product_id) {
        const objectParams = removeUndefinedObject(this);

        if (objectParams.product_attributes) {
            // update child
            await updateProductId({
                product_id,
                bodyUpdate: updateNestedObjectParser(objectParams.product_attributes),
                model: clothing
            })
        }

        const updateProduct = await super.updateProduct(product_id, updateNestedObjectParser(objectParams))
        return updateProduct
    }
}

// define sub-class for different product types Electronics
class Electronics extends Product {
    async createProduct() {
        const newElectronic = await electronics.create({
            ...this.product_attributes,
            product_shop: this.product_shop,
            type: this.product_type
        })
        if (!newElectronic) throw new BadRequestError('create new Electronics error');

        const newProduct = await super.createProduct(newElectronic._id);
        if (!newProduct) throw new BadRequestError('create new Product error');

        return newProduct;
    }
}

// define sub-class for different product types Furniture
class Furnitures extends Product {
    async createProduct() {
        const newFurniture = await furniture.create({
            ...this.product_attributes,
            product_shop: this.product_shop,
            type: this.product_type
        })
        if (!newFurniture) throw new BadRequestError('create new Furnitures error');

        const newProduct = await super.createProduct(newFurniture._id);
        if (!newProduct) throw new BadRequestError('create new Product error');

        return newProduct;
    }
}

// register product types
ProductFactory.registerProductType('Electronics', Electronics)
ProductFactory.registerProductType('Clothing', Clothing)
ProductFactory.registerProductType('Furniture', Furnitures)

module.exports = ProductFactory;