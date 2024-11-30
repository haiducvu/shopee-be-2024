'user strict'

const JWT = require('jsonwebtoken')
const { asyncHandler } = require('./checkAuth')
const { AuFailureError, NotFoundError, ErrorResponse, BadRequestError, ForbiddenError } = require('../core/error.response')
const { findByUserId } = require('../services/keyToken.service')
const KeyTokenService = require('../services/keyToken.service')
const HEADER = {
    API_KEY: 'x-api-key',
    CLIENT_ID: 'x-client-id',
    AUTHORIZATION: 'authorization'
}

const createTokenPair = async (payload, publicKey, privateKey) => {
    try {
        // accessToken
        const accessToken = await JWT.sign(payload, publicKey, {
            expiresIn: '14 days' // '14 days'
        })

        const refreshToken = await JWT.sign(payload, privateKey, {
            expiresIn: '20 days' // '20 days'
        })

        JWT.verify(accessToken, publicKey, (err, decode) => {
            if (err) {
                console.log(`error verify::`, err)
            } else {
                console.log(`decode verify::`, decode)
            }
        })
        return { accessToken, refreshToken }
    } catch (error) {

    }
}

const authentication = asyncHandler(async (req, res, next) => {
    /**
     * 1- check userId missing??
     * 2- get accessToken
     * 3- verify Token
     * 4- check user in bds?
     * 5- check keyStore with this userId?
     * 6- OK all -> return next()
     */

    const userId = req.headers[HEADER.CLIENT_ID]

    if (!userId) throw new AuFailureError('Invalid Request');

    const keyStore = await findByUserId(userId);
    if (!keyStore) throw new NotFoundError('Invalid Keystore');

    const accessToken = req.headers[HEADER.AUTHORIZATION]
    if (!accessToken) throw new AuFailureError('Invalid Request');

    try {
        // check access token expired
        const decodeUser = JWT.verify(accessToken, keyStore.publicKey);
        if (userId !== decodeUser.userId) throw new AuFailureError('Invalid UserId');
        req.keyStore = keyStore;
        req.user = decodeUser;
        return next();
    } catch (error) {
        throw new AuFailureError(error.message)
    }
})

const verifyJWT = async (token, keySecret) => {
    return await JWT.verify(token, keySecret)
}

async function verifyJWTRefreshToken(token, keySecret, userId) {
    try {
        const decoded = await JWT.verify(token, keySecret)
        return decoded
    } catch (error) {
        await KeyTokenService.deleteKeyById(userId)
        throw new ForbiddenError('Something went wrong happen! Please re-login')
        throw new BadRequestError('Invalid token or token expired')
    }
}

module.exports = {
    createTokenPair,
    authentication,
    verifyJWT,
    verifyJWTRefreshToken
}