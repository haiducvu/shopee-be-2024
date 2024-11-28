'use strict'

const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { ErrorResponse } = require('../core/error.response')
const { SuccessResponse } = require('../core/success.response')
const USER = require('../models/user.model')
const { sendEmailToken } = require('./email.service')
const { checkEmailToken } = require('./otp.service');
const { createUser } = require("../models/repositories/user.repo");
const KeyTokenService = require("./keyToken.service");
const { createTokenPair, verifyJWT } = require("../auth/authUtils");
const { getInfoData } = require("../utils");

const newUserService = async ({
    email = null,
    captcha = null
}) => {
    // 1. Check email exists in dbs
    const user = await USER.findOne({ email }).lean()
    // 2. if exists
    if (user) {
        return ErrorResponse({
            message: 'Email already exits'
        })
    }

    // 3. send token via Email user
    const result = await sendEmailToken({ email })
    return {
        message: 'Verify email user',
        metadata: {
            token: result
        }
    }
}

const checkLoginEmailTokenService = async ({
    token
}) => {
    try {
        // 1. check token in otp
        // const { otp_email: email, otp_token } = await checkEmailToken({ token })
        // if (!email) throw new ErrorResponse('Token not found')
        // 2. check email exists in user model
        // const hasUser = await findUserByEmailWithLogin({
        //     email
        // })
        // if (hasUser) throw new ErrorResponse('Email already exists')

        // new User
        const passwordHash = await bcrypt.hash(token, 10)

        const newUser = await createUser({
            usr_id: 1,
            usr_slug: 'xyz',
            usr_email: 'duchaivu1997@gmail.com',
            usr_password: passwordHash,
            usr_role: '66a5c2bd2914f32ecf0d2528'
        })

        if (newUser) {
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

            const keyStore = await KeyTokenService.createKeyToken({ userId: newUser._id, publicKey, privateKey })

            if (!keyStore) {
                return {
                    code: 'xxx',
                    message: 'KeyStore error'
                }
            }

            // created token pair
            const tokens = await createTokenPair({ userId: newUser._id, email: 'duchaivu1997@gmail.com' }, publicKey, privateKey)
            console.log(`Created Token Success::`, tokens)

            return {
                code: 201,
                message: 'Verify successfully',
                metadata: {
                    user: getInfoData({ fields: ['usr_id', 'usr_name', 'usr_email'], object: newUser }),
                    tokens
                }
            }

        }
    } catch (error) {

    }
}

const findUserByEmailWithLogin = async ({ email }) => {
    const user = await USER.findOne({ usr_email: email }).lean()
    return user
}

module.exports = {
    newUserService,
    checkLoginEmailTokenService
}