'user strict'
const {
    BadRequestError,
    NotFoundError
} = require('../core/error.response');
const { cart } = require('../models/cart.model');
const { getProductById } = require('../models/repositories/product.repo');
const { purchasesStatus } = require('../utils/purchasesStatus');

/**
 * add product to cart [user]
 * reduce produce quantity by one [user]
 * increase product quantity by one [user]
 * get cart [user]
 * delete cart [user]
 * delete cart item [user]
 */

class CartService {
    // START REPO CART
    static async createUserCart({ userId, buy_count, product }) {
        const addBuyToCount = {
            ...product,
            buy_count,
            status: purchasesStatus.inCart
        }
        const query = { cart_userId: userId, cart_state: purchasesStatus.inCart },
            updateOrInsert = {
                $addToSet: {
                    cart_products: addBuyToCount
                }
            }, options = { upsert: true, new: true }
        return await cart.findOneAndUpdate(query, updateOrInsert, options)
    }

    static async updateUserCartBuyCount({ userId, buy_count, product }) {
        const { productId, quantity } = product;
        const query = { cart_userId: userId, 'cart_products._id': product._id, cart_state: purchasesStatus.inCart },
            updateSet = {
                $inc: {
                    'cart_products.$.buy_count': buy_count
                }
            }, options = { upsert: true, new: true }
        return await cart.findOneAndUpdate(query, updateSet, options)
    }

    static async updateUserCartQuantity({ userId, product }) {
        const { productId, quantity } = product;
        const query = { cart_userId: userId, 'cart_products.productId': productId, cart_state: purchasesStatus.inCart },
            updateSet = {
                $inc: {
                    'cart_products.$.quantity': quantity
                }
            }, options = { upsert: true, new: true }
        return await cart.findOneAndUpdate(query, updateSet, options)
    }


    // END REPO CART
    static async addToCart({ userId, buy_count ,product = {} }) {
        // check cart ton tai hay khong?
        const userCart = await cart.findOne({ cart_userId: userId })
        if (!userCart) {
            // create cart for User
            return await CartService.createUserCart({ userId, buy_count, product })
        }

        // neu co gio hang roi nhung chua co san pham?
        if (!userCart.cart_products.length) {
            userCart.cart_products = [product]
            return await userCart.save()
        }

        const products = userCart?.cart_products;
        const productExistInCart = products.some(p => p._id === product._id)

        if(productExistInCart) {
            // update buy count
            // gio hang ton tai, va co san pham nay thi update quantity
            // return await CartService.updateUserCartQuantity({ userId, product })
            return await CartService.updateUserCartBuyCount({ userId, buy_count, product })
        } else {
            // add other product in Cart
            return await CartService.createUserCart({ userId, buy_count, product })
        }


    }

    // update cart
    /**
     * shop_order_ids: [{
     *  shopId,
     *  item_products: [
     *  quantity,
     *  price,
     *  shopId,
     *  old_quantity,
     *  productId 
     * ],
     * version
     * }]
     */

    static async addToCartV2({ userId, shop_order_ids }) {
        const { productId, quantity, old_quantity } = shop_order_ids[0]?.item_products[0]
        // check product
        const foundProduct = await getProductById(productId)
        if (!foundProduct) throw new NotFoundError('')

        // compare
        if (foundProduct.product_shop.toString() !== shop_order_ids[0]?.shopId) {
            throw new NotFoundError('Product do not belong to the shop')
        }

        if (quantity === 0) {
            // deleted
        }
        return await CartService.updateUserCartQuantity({
            userId, product: {
                productId,
                quantity: quantity - old_quantity
            }
        })
    }

    static async deleteUserCart({ userId, productId }) {
        const query = { cart_userId: userId, cart_state: purchasesStatus.inCart },
            updateSet = {
                $pull: {
                    cart_products: {
                        productId
                    }
                }
            }
        const deleteCart = await cart.updateOne(query, updateSet)
        return deleteCart
    }

    static async getListUserCart({ query, cart_userId }) {
        // return await cart.findOne({
        //     cart_userId: +userId
        // }).lean()
        // TODO: handle filter status
        return await cart.findOne({
            cart_userId
        }).lean()
    }
}

module.exports = CartService