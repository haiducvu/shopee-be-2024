'use strict'

const express = require('express');
const { apiKey, permission } = require('../auth/checkAuth');
const { pushToLogDiscord } = require('../middleware');
const router = express.Router();

// add log to discord
router.use(pushToLogDiscord);

// check apiKey
router.use(apiKey);

// check permission
router.use(permission('0000'));

// library
router.use('/v1/api/library', require('./library'))

// role and permission
router.use('/v1/api/profile', require('./profile')) // just testing for learning
router.use('/v1/api/rbac', require('./rbac'))


router.use('/v1/api/email', require('./email'))
router.use('/v1/api/user', require('./user'))

router.use('/v1/api/checkout', require('./checkout'))
router.use('/v1/api/discount', require('./discount'))
router.use('/v1/api/inventory', require('./inventory'))
router.use('/v1/api/purchases', require('./cart')) // /cart

router.use('/v1/api/product', require('./shop'))

router.use('/v1/api/upload', require('./upload'))

router.use('/v1/api/comment', require('./comment'))

router.use('/v1/api/notification', require('./notification'))

// authentication
router.use('/v1/api', require('./access'))


module.exports = router;