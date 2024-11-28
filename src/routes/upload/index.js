'use strict'

const express = require('express');
const router = express.Router();
const uploadController = require('../../controllers/upload.controller');
const { asyncHandler } = require('../../auth/checkAuth');
const { authentication } = require('../../auth/authUtils');
const { uploadDisk, uploadMemory } = require('../../configs/multer.config');
const imageController = require('../../controllers/image.controller');


// router.use(authentication);

// upload cloudinary
router.post('/product', asyncHandler(uploadController.uploadFile))
router.post('/product/thumb', uploadDisk.single('file'), asyncHandler(uploadController.uploadFileThumb))
router.post('/product/multiple', uploadDisk.array('file', 3), asyncHandler(uploadController.uploadImageFromLocalFiles))

// upload s3
router.post('/product/bucket', uploadMemory.single('file'), asyncHandler(uploadController.uploadImageFromLocalS3))

module.exports = router;