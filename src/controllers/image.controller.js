'use strict'

const { SuccessResponse } = require("../core/success.response");
const { saveImage } = require("../services/image.service");

class ImageController {
    saveImage = async (req, res, next) => {
        new SuccessResponse({
            message: 'Save image Product success',
            metadata: await saveImage(req.body)
        }).send(res)
    }
}

module.exports = new ImageController();