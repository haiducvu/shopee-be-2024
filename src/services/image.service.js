'use strict'

const imageModel = require('../models/images.model')
const { Types } = require('mongoose');

class ImageService {

    static saveImage = async ({image_url, shopId, productId}) => {
        try {
            const result = await imageModel.create({image_url, shopId, productId})
            return result;
        } catch (error) {
            return error
        }
    }
}

module.exports = ImageService