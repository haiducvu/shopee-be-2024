'use strict'
const cloudinary = require('../configs/cloudinary.config')
const { s3, PutObjectCommand, GetObjectCommand, DeleteBucketCommand } = require('../auth/s3.config')
const crypto = require('crypto')
// const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const { getSignedUrl } = require('@aws-sdk/cloudfront-signer')
const { S3Client } = require('@aws-sdk/client-s3')
const imagesModel = require('../models/images.model')
const productModel = require('../models/product.model')

const randomName = () => crypto.randomBytes(16).toString('hex')

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
});

// upload file use s3Client
const uploadImageFromLocalS3 = async ({ file }) => {
    try {
        const imageName = randomName()
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: imageName || 'unknown',
            Body: file.buffer,
            ContentType: file.mimetype || 'image/jpeg',
        })

        const result = await s3.send(command)
        console.log('result', result)

        // S3
        // const signedUrl = new GetObjectCommand({
        //     Bucket: process.env.AWS_BUCKET_NAME,
        //     Key: imageName || 'unknown',
        // })

        // const url = await getSignedUrl(s3, signedUrl, { expiresIn: 3600 })

        // console.log('url', url)
        // return {
        //     url: `${process.env.URL_IMAGE_PRIVATE}/${imageName}`,
        //     result
        // }

        // have cloudfront url export
        const url = getSignedUrl({
            url: `${process.env.URL_IMAGE_PRIVATE}/${imageName}`,
            dateLessThan: new Date(Date.now() + 1000 * 60), // het han 60s
            keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
            privateKey: process.env.CLOUDFRONT_PRIVATE_KEY,
        })

        console.log('url', url)
        return {
            url,
            result
        }

    } catch (error) {
        console.error(`Error uploading image use S3Client::`, error)
    }
}

// END s3 service

// 1. Upload from url image
const uploadImageFromURL = async () => {
    try {
        const urlImage = 'https://down-vn.img.susercontent.com/file/sg-11134201-22100-eq76mjamewiv16';
        const folderName = 'product/shopId', newFileName = 'testdemo'
        const result = await cloudinary.uploader.upload(urlImage, {
            resource_type: 'image',
            secure: true,
            folder: folderName,
            public_id: newFileName
        })
        return result
    } catch (error) {
        throw error
    }
}

// const updateProductId = async ({
//     product_id,
//     bodyUpdate,
//     model,
//     isNew = true
// }) => {
//     return await model.findByIdAndUpdate(product_id, bodyUpdate, {
//         new: isNew
//     })
// }

// 2. upload from image local
const uploadImageFromLocal = async (path) => {
    try {
        const result = await cloudinary.uploader.upload(path.path, {
            folder: `product/${path.shopId}/${path.productId}`,
            public_id: `${path.shopId}/-/${path.productId}`
        })

        // store images in DB
        await imagesModel.create({ image_url: result.url, shop_id: path.shopId, product_id: path.productId })

        // code temp to update image for product when upload

        // await productModel.product.findByIdAndUpdate(
        //     path.productId,
        //     { product_thumb: result.url },
        //     { new: true } // This option returns the updated document
        // );

        return {
            image_url: result.url,
            shopId: path.shopId,
            productId: path.productId,
            thumb_url: await cloudinary.url(result.public_id, {
                width: 200,
                height: 200,
                // format: 'webp',
                // crop: 'fill'
            })
        }
    } catch (error) {
        throw error
    }
}

// 3. upload from image local multiple
const uploadImageFromLocalFiles = async (files, folderName = 'product/8409') => {
    try {
        console.log(`files`, files, folderName)
        if (!files.length) { return }
        const uploadUrls = []
        for (const file of files) {
            const result = await cloudinary.uploader.upload(file.path, {
                folder: folderName
            })

            uploadUrls.push({
                image_url: result.secure_url,
                shopId: 8409,
                thumb_url: await cloudinary.url(result.public_id, {
                    width: 100,
                    height: 100,
                    format: 'jpg'
                    // format: 'webp',
                    // crop: 'fill'
                })
            })
        }
        return uploadUrls
    } catch (error) {
        throw error
    }
}

module.exports = {
    uploadImageFromURL,
    uploadImageFromLocal,
    uploadImageFromLocalFiles,
    uploadImageFromLocalS3
}

