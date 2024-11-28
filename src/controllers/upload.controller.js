'use strict'

const { SuccessResponse } = require('../core/success.response')
const { BadRequestError } = require('../core/error.response')
const uploadService = require('../services/upload.service')

class UploadController {
    uploadFile = async (req, res, next) => {
        new SuccessResponse({
            message: 'Upload file success',
            metadata: await uploadService.uploadImageFromURL()
        }).send(res)
    }

    uploadFileThumb = async (req, res, next) => {
        const { file, body, query, params } = req;
        const shopId = body.shopId || query.shopId || params.shopId;
        const productId = body.productId || query.productId || params.productId;

        if (!file) {
            return new BadRequestError('No file uploaded')
        }
        new SuccessResponse({
            message: 'Upload file success',
            metadata: await uploadService.uploadImageFromLocal({
                path: file.path,
                shopId,
                productId
            })
        }).send(res)
    }

    uploadImageFromLocalFiles = async (req, res, next) => {
        const { files } = req
        if (!files.length) {
            throw new BadRequestError(`File missing`)
        }
        new SuccessResponse({
            message: 'Upload file success',
            metadata: await uploadService.uploadImageFromLocalFiles({
                files
            })
        }).send(res)
    }

    uploadImageFromLocalS3 = async (req, res, next) => {
        const { file } = req
        if (!file) {
            throw new BadRequestError(`File missing`)
        }
        new SuccessResponse({
            message: 'Upload file success',
            metadata: await uploadService.uploadImageFromLocalS3({
                file
            })
        }).send(res)
    }
}

module.exports = new UploadController()

