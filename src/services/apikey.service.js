'use strict'

const apiKeyModel = require('../models/apiKey.model');
const crypto = require('crypto')
const findById = async (key) => {
    // Create api key, api key should in proxy not in FE
    // Khi FE request toi BE, thi co Proxy o giua, Proxy se goi kem request cho BE, BE se verify apikey, 
    // apikey trong Proxy se la domain cua DN mua
    // const newKey = await apiKeyModel.create({ key: crypto.randomBytes(64).toString('hex'), permissions: ['0000'] })
    // console.log('newKeyXXXXXXXXXXX', newKey);
    const objKey = await apiKeyModel.findOne({ key, status: true }).lean()
    return objKey;
}

module.exports = {
    findById
}