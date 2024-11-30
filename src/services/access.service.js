"use strict";

const shopModel = require("../models/shop.model");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const KeyTokenService = require("./keyToken.service");
const { createTokenPair, verifyJWT, verifyJWTRefreshToken } = require("../auth/authUtils");
const { getInfoData } = require("../utils");
const { BadRequestError, AuFailureError, ForbiddenError } = require("../core/error.response");
const { findByEmail } = require("./shop.service");
const keytokenModel = require("../models/keytoken.model");

const RoleShop = {
    SHOP: 'SHOP',
    WRITER: 'WRITER',
    EDITOR: 'EDITOR',
    ADMIN: 'ADMIN'
}

class AccessService {

    static handleRefreshToken = async (refreshToken) => {

        const foundToken = await KeyTokenService.findByRefreshTokenUsed(refreshToken);

        if (foundToken) {
            // check refresh token expired
            const { userId, email } = await verifyJWTRefreshToken(refreshToken, foundToken.privateKey, foundToken.user)
        }

        const holderToken = await KeyTokenService.findByRefreshToken(refreshToken)
        if (!holderToken) throw new AuFailureError('Shop not registered1')

        const { userId, email } = await verifyJWT(refreshToken, holderToken.privateKey)

        const foundShop = await findByEmail({ email })
        if (!foundShop) throw new AuFailureError('Shop not registered2')

        const tokens = await createTokenPair({ userId, email }, holderToken.publicKey, holderToken.privateKey)

        await keytokenModel.findByIdAndUpdate(holderToken._id, {
            $set: {
                refreshToken: refreshToken
            },
            $addToSet: {
                refreshTokensUsed: refreshToken
            }
        })

        return {
            user: { userId, email },
            tokens : {
                ...tokens,
                refreshToken: refreshToken

            }
        }
    }

    static logout = async (keyStore) => {
        const delKey = await KeyTokenService.removeKeyById(keyStore._id);
        return delKey;
    }

    /**
        1- Check mail in dbs
        2- match password
        3- create AT vs RT and save
        4- generate tokens
        5- get data return login
     */

    static login = async ({ email, password, refreshToken = null }) => {
        const foundShop = await findByEmail({ email })
        if (!foundShop) throw new BadRequestError('Shop not registered');

        const match = bcrypt.compare(password, foundShop.password);
        if (!match) throw new AuFailureError('Authentication error')

        const privateKey = crypto.randomBytes(64).toString('hex');
        const publicKey = crypto.randomBytes(64).toString('hex');
        const { _id: userId } = foundShop
        const tokens = await createTokenPair({ userId, email }, publicKey, privateKey)

        await KeyTokenService.createKeyToken({
            refreshToken: tokens.refreshToken,
            privateKey, publicKey, userId
        })

        return {
            shop: getInfoData({ fields: ['_id', 'name', 'email'], object: foundShop }),
            tokens
        }
    }

    static signUp = async ({ name, email, password }) => {

        const holderShop = await shopModel.findOne({ email }).lean();
        if (holderShop) {
            throw new BadRequestError('Error: Shop already registered!')
        }
        const passwordHash = await bcrypt.hash(password, 10)
        const newShop = await shopModel.create({
            name, email, password: passwordHash, roles: [RoleShop.SHOP]
        })

        if (newShop) {
            // created privateKey, publicKey
            // const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
            //     modulusLength: 4096,
            //     publicKeyEncoding: {
            //         type: 'pkcs1',
            //         format: 'pem'
            //     },
            //     privateKeyEncoding: {
            //         type: 'pkcs1',
            //         format: 'pem'
            //     }
            // })
            // console.log({ privateKey, publicKey }) // save collection KeyStore

            // other way
            const privateKey = crypto.randomBytes(64).toString('hex');
            const publicKey = crypto.randomBytes(64).toString('hex');

            const keyStore = await KeyTokenService.createKeyToken({ userId: newShop._id, publicKey, privateKey })

            if (!keyStore) {
                return {
                    code: 'xxx',
                    message: 'KeyStore error'
                }
            }

            // created token pair
            const tokens = await createTokenPair({ userId: newShop._id, email }, publicKey, privateKey)
            console.log(`Created Token Success::`, tokens)

            return {
                code: 201,
                metadata: {
                    shop: getInfoData({ fields: ['_id', 'name', 'email'], object: newShop }),
                    tokens
                }
            }

        }
        return {
            code: 200,
            metadata: null
        }

    };
}

module.exports = AccessService;
