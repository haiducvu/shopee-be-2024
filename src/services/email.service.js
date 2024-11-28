'use strict'

const { NotFoundError } = require("../core/error.response")
const transport = require("../dbs/init.nodemailer")
const { replacePlaceholder } = require("../utils")
const { newOtp } = require("./otp.service")
const { getTemplate } = require("./template.service")

const sendEmailLinkVerify = async ({
    html,
    toEmail,
    subject = 'xac nhan Email dang ky',
    text = 'xac nhan...'
}) => {
    try {
        const mailOptions = {
            from: '"ShopDEV" <duchaivu1997@gmail.com>',
            to: toEmail,
            subject,
            text,
            html
        }
        // console.log('transport', transport)
        transport.sendMail(mailOptions, (err, info) => {
            if (err) {
                return console.log(err)
            }
            console.log('Message sent::', info.messageId);
        })
    } catch (error) {
        console.log(`error send Email: `, error)
        return error
    }
}

const sendEmailToken = async ({ email = null }) => {
    try {
        // 1. get token
        const token = await newOtp({ email })
        // 2. get template
        const template = await getTemplate({
            tem_name: 'HTML EMAIL TOKEN'
        })

        if (!template) {
            throw new NotFoundError('Template not found')
        }

        // 3. replace placeholder with params
        const content = replacePlaceholder(
            template.tem_html,
            {
                link_verify: `http://localhost:3056/v1/api/user/welcome-back?token=${token.otp_token}`
            }
        )
        sendEmailLinkVerify({
            html: content,
            toEmail: email,
            subject: 'Vui long xac nhan dia chi Email dang ky ShopDEV.com!'
        }).catch(err => console.error(err))
        return 1
    } catch (error) {
        throw error
    }
}

module.exports = {
    sendEmailToken
}