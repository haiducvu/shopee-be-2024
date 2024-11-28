'use strict';

const { getRedis } = require('../dbs/init.redis');
const { product } = require('../models/product.model');
const { reservationInventory } = require('../models/repositories/inventory.repo');
const { convertToOjectIdMongodb } = require('../utils');

const acquireLock = async (productId, quantity, cartId) => {
    const redisClient = getRedis();
    const key = `lock_v2023${productId}`;
    const retryTimes = 10;
    const expireTime = 3000; // 3 seconds temporary lock

    for (let i = 0; i < retryTimes; i++) {
        try {
            // Use SET with NX option to acquire lock
            const result = await redisClient.set(key, expireTime, {
                NX: true,
                PX: expireTime, // Expire time in milliseconds
            });
            console.log(`Key set result for ${key}: ${result}`);
            if (result) {
                // update inventory
                const isReservation = await reservationInventory({ productId, quantity, cartId });
                if (isReservation?.modifiedCount) {
                    // update product quantity
                    await product.updateOne({
                        _id: convertToOjectIdMongodb(productId),
                    },
                        {
                            $inc: {
                                product_quantity: -quantity
                            }
                        })
                    return key; // Return lock key if reservation successful
                }
                await redisClient.del(key); // Release lock on failure
                return null;
            } else {
                // Wait before retrying
                await new Promise((resolve) => setTimeout(resolve, 50));
            }
        } catch (error) {
            console.error(`Error acquiring lock: ${error.message}`);
            throw error;
        }
    }

    return null; // Return null if lock couldn't be acquired after retries
};

const releaseLock = async (keyLock) => {
    const redisClient = getRedis();
    try {
        const result = await redisClient.del(keyLock);
        return result;
    } catch (error) {
        console.error(`Error releasing lock: ${error.message}`);
        throw error;
    }
};

module.exports = {
    acquireLock,
    releaseLock,
};