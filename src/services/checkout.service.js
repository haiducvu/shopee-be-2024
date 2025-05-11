'use strict'
const { findCartById } = require('../models/repositories/cart.repo')
const { BadRequestError, NotFoundError, ErrorResponse } = require("../core/error.response");
const { checkProductByServer, findAllProductPublishByShopId } = require('../models/repositories/product.repo');
const { getDiscountAmount } = require('../services/discount.service');
const { acquireLock, releaseLock } = require('./redis.service');
const { order } = require('../models/order.model');
const { product } = require('../models/product.model')
const { getRedis } = require('../dbs/init.redis');
const { EmailProducer } = require('../message-queue/producer/email-producer');

class CheckoutService {
    // login and without login
    /**
        {
            cartId,
            userId,
            shop_order_ids: [
                {
                    shopId,
                    shop_discounts: [
                        {
                            shopId,
                            discountId,
                            codeId
                        }
                    ],
                    item_products: [
                        {
                            price,
                            quantity,
                            productId
                        }
                    ]
                }
            ]
        },
        ...
     */
    static async checkoutReview({
        cartId, userId, shop_order_ids
    }) {
        // check cartId ton tai khong?
        const foundCart = await findCartById(cartId)
        if (!foundCart) {
            throw new NotFoundError('Cart not found')
        }

        const checkout_order = {
            totalPrice: 0, // tong tien hang
            feeShip: 0, // phi van chuyen
            totalDiscount: 0, // tong tien discount giam gia
            totalCheckout: 0 // tong thanh toan
        }
        const productsPriceSelected = []

        // tinh tong tien bill
        for (let i = 0; i < shop_order_ids.length; i++) {
            const { shopId, product_id, buy_count, shop_discounts = [] } = shop_order_ids[i];
            // get all product buy shopId
            const item_products = await findAllProductPublishByShopId(shopId);
            // get product was selected
            const foundProduct = await product.findOne({
                _id: product_id,
                product_shop: shopId,
                isPublished: true
            });

            if (!foundProduct) {
                throw new NotFoundError('Product not found in Shop');
            }

            if (foundProduct.product_quantity < buy_count) {
                throw new ErrorResponse('Product quantity not enough');
            }
            // tinh tong tien hang
            const checkoutProductPrice = foundProduct.product_price * buy_count
            productsPriceSelected.push(checkoutProductPrice)

            // TODO handle discount product
            // neu shop_discounts ton tai > 0, check xem co hop le hay khong
            // if (shop_discounts.length > 0) {
            //     // gia su chi co mot discount
            //     // get amount discount
            //     const { totalPrice = 0, discount = 0 } = await getDiscountAmount({
            //         codeId: shop_discounts[0].codeId,
            //         userId,
            //         shopId,
            //         products: checkProductServer
            //     })
            //     // tong cong discount giam gia
            //     checkout_order.totalDiscount += discount

            //     // neu tien giam gia lon hon 0
            //     if (discount > 0) {
            //         itemCheckout.priceApplyDiscount = checkoutPrice - discount
            //     }
            // }
        }

        const totalCheckoutProductPrice = productsPriceSelected.reduce((acc, curr) => acc + curr, 0)

        checkout_order.totalPrice = +totalCheckoutProductPrice
        checkout_order.totalCheckout = +totalCheckoutProductPrice

        return {
            shop_order_ids,
            checkout_order
        }
    }

    // order

    static async orderByUser({
        cartId, userId, shop_order_ids
    }) {

        // try transaction redis for lock product
        // Example usage
        // const redisClient = getRedis();
        // const productStockKey = `product:product123:stock`;
        // await redisClient.set(productStockKey, 10);
        // this.placeOrder('product123', 2, 'user456');
        //

        const { checkout_order } = await CheckoutService.checkoutReview({
            cartId,
            userId,
            shop_order_ids
        })

        const acquireProduct = [];
        for (let i = 0; i < shop_order_ids.length; i++) {
            const { product_id, buy_count } = shop_order_ids[i];
            const keyLock = await acquireLock(product_id, buy_count, cartId)
            acquireProduct.push(keyLock ? true : false)
            console.log('acquireProduct', acquireProduct, keyLock)
            if (keyLock) {
                // await releaseLock(keyLock)
            }
        }

        // check if co mot san pham het hang trong kho
        if (acquireProduct.includes(false)) {
            throw new BadRequestError(`Product out of stock!!!`)
        }

        const newOrder = await order.create({
            order_userId: userId,
            order_checkout: checkout_order,
            order_products: shop_order_ids,
            order_shipping: 'user_address',
            order_payment: 'user_payment'
        })

        // truong hop: neu insert thanh cong, thi remove product co trong cart
        // if (newOrder) {
        //     // remove product in cart
        //     await removeProductInCart
        // }

        // handle Gởi Email xác nhận đơn hàng
        new EmailProducer().sendEmail('Order confirmation email');

        return newOrder
    }

    // query orders [Users]
    static async getOrdersByUser(userId) {
    }

    // query order using Id [Users]
    static async getOneOrderByUser(orderId) {
    }

    // cancel order [Users]
    static async cancelOrderByUser(orderId) {
    }

    // update order status [Shop | Admin]
    static async updateOrderStatusByShop(orderId, status) {
    }


    static async placeOrder(productId, quantity, userId) {
    const redisClient = getRedis();
    const productStockKey = `product:${productId}:stock`; // Key for product stock
    const orderLogKey = `order:${userId}:${Date.now()}`; // Key for user order log

    try {
        
        // Watch the product stock to avoid race conditions
        await redisClient.watch(productStockKey);

        // Check current stock
        const currentStock = await redisClient.get(productStockKey);
        if (!currentStock || parseInt(currentStock) < quantity) {
            console.log('Insufficient stock.');
            return;
        }

        // Start a transaction
        const transaction = redisClient.multi();

        // Deduct stock
        transaction.decrBy(productStockKey, quantity);

        // Log the order
        transaction.set(orderLogKey, JSON.stringify({ productId, quantity, userId, date: new Date() }));

        // Execute the transaction
        const result = await transaction.exec();

        if (result === null) {
            console.log('Transaction failed due to a race condition. Try again.');
        } else {
            console.log('Order placed successfully:', result, orderLogKey);
        }
    } catch (err) {
        console.error('Error placing order:', err);
    } finally {
        // Unwatch the key
        await redisClient.unwatch();
    }
}

}

module.exports = CheckoutService



// // tinh tong tien bill
// for (let i = 0; i < shop_order_ids.length; i++) {
//     const { shopId, shop_discounts = [] } = shop_order_ids[i] // item_products = []
//     // get all product by shopId
//     const item_products = await findAllProductPublishByShopId(shopId);
//     // check product available
//     const checkProductServer = await checkProductByServer(item_products)
//     if (!checkProductServer[0]) throw new BadRequestError(`order wrong!!!`)

//     const checkoutPrice = checkProductServer.reduce((acc, product) => {
//         return acc + (product.quantity * product.price)
//     }, 0)
//     // tong tien truoc khi xu ly
//     checkout_order.totalPrice = + checkoutPrice

//     const itemCheckout = {
//         shopId,
//         shop_discounts,
//         priceRaw: checkoutPrice, // truoc khi giam gia
//         priceApplyDiscount: checkoutPrice,
//         item_products: checkProductServer
//     }

//     // neu shop_discounts ton tai > 0, check xem co hop le hay khong
//     if (shop_discounts.length > 0) {
//         // gia su chi co mot discount
//         // get amount discount
//         const { totalPrice = 0, discount = 0 } = await getDiscountAmount({
//             codeId: shop_discounts[0].codeId,
//             userId,
//             shopId,
//             products: checkProductServer
//         })
//         // tong cong discount giam gia
//         checkout_order.totalDiscount += discount

//         // neu tien giam gia lon hon 0
//         if (discount > 0) {
//             itemCheckout.priceApplyDiscount = checkoutPrice - discount
//         }
//     }
//     // tong thanh toan cuoi cung
//     checkout_order.totalCheckout += itemCheckout.priceApplyDiscount
//     shop_order_ids_new.push(itemCheckout)
// }