"use strict";

const { Types } = require("mongoose");
const { getSelectData, unGetSelectData, convertToOjectIdMongodb, removeUndefinedObject } = require('../../utils')

const {
    product,
    electronics,
    clothing,
    furniture,
} = require("../../models/product.model");

const findAllDraftsForShop = async ({ query, limit, skip }) => {
    return await queryProduct({ query, limit, skip })
};

const findAllPublishForShop = async ({ query, limit, skip }) => {
    return await queryProduct({ query, limit, skip })
}

const publishProductByShop = async ({ product_shop, product_id }) => {
    const foundShop = await product.findOne({
        product_shop,//: new Types.ObjectId(product_shop),
        _id: product_id//new Types.ObjectId(product_id),
    });
    if (!foundShop) return null

    foundShop.isDraft = false
    foundShop.isPublished = true
    const { modifiedCount } = await foundShop.updateOne(foundShop)
    return modifiedCount
};

const unPublishProductByShop = async ({ product_shop, product_id }) => {
    const foundShop = await product.findOne({
        product_shop: new Types.ObjectId(product_shop),
        _id: new Types.ObjectId(product_id),
    });
    if (!foundShop) return null

    foundShop.isDraft = true
    foundShop.isPublished = false
    const { modifiedCount } = await foundShop.updateOne(foundShop)
    return modifiedCount
};

const queryProduct = async ({ query, limit, skip }) => {
    return await product
        .find(query)
        .populate("product_shop", "name email -_id")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .learn()
        .exec();
};

const searchProduct = async ({ keySearch }) => {
    const regexSearch = new RegExp(keySearch);
    const results = await product.find({
        isPublished: true,
        $text: { $search: regexSearch }
    },
        {
            score: {
                $meta: 'textScore'
            }
        }).sort({ score: { $meta: 'textScore' } }).lean()
    return results;
}

const findAllProducts = async ({ limit, sort, page, filter, select, category }) => {
    const addFilter = {
        ...filter,
        product_type: category
    }
    const objFilter = removeUndefinedObject(addFilter)
    const skip = (page - 1) * limit;
    const totalProducts = await product.find(objFilter)
    const sortBy = sort === 'ctime' ? { _id: -1 } : { _id: 1 }
    const products = await product.find(objFilter)
        .sort(sortBy).skip(skip).limit(limit).select(getSelectData(select)).lean()
    return {
        products,
        pagination: {
            limit: Number(limit),
            page: Number(page),
            page_size: Math.round(totalProducts.length / limit)
          },
    }
}
// electronics,
// clothing,
// furniture,
const findAllCategories  = async () => {
    // const x = await clothing.find({}) // Ensure this is the correct model name
    //     .populate('product_shop', 'name') // Populating only the 'name' field
    //     .exec();

    // console.log('x===============', x)
    // return x;

    const data = await [
        {
            _id: 1,
            name: 'Clothing',
        },
        {
            _id: 2,
            name: 'Electronics',
        },
        {
            _id: 3,
            name: 'Furniture',
        }
    ]

    return data;
}


const findProduct = async ({ product_id, unSelect }) => {
    return await product.findById(product_id).select(unGetSelectData(unSelect))
}

const updateProductId = async ({
    product_id,
    bodyUpdate,
    model,
    isNew = true
}) => {
    return await model.findByIdAndUpdate(product_id, bodyUpdate, {
        new: isNew
    })
}

const getProductById = async (productId) => {
    return await product.findOne({ _id: convertToOjectIdMongodb(productId) }).lean()
}

const checkProductByServer = async (products) => {
    return await Promise.all(products.map(async product => {
        const foundProduct = await getProductById(product._id)
        if (foundProduct) {
            return {
                price: foundProduct.product_price,
                quantity: foundProduct.product_quantity,
                productId: foundProduct._id
            }

        }
    }))
}

const findAllProductPublishByShopId = async(shopId) => {
    return await product.find({product_shop: shopId, isPublished: true}).lean()
}

module.exports = {
    findAllDraftsForShop,
    findAllPublishForShop,
    publishProductByShop,
    unPublishProductByShop,
    findAllCategories,
    searchProduct,
    findAllProducts,
    findProduct,
    updateProductId,
    getProductById,
    checkProductByServer,
    findAllProductPublishByShopId
};
