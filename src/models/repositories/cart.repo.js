const { convertToOjectIdMongodb } = require("../../utils")
const { purchasesStatus } = require("../../utils/purchasesStatus")
const { cart } = require("../cart.model")

const findCartById = async (cardId) => {
    return await cart.findOne({ _id: convertToOjectIdMongodb(cardId), cart_state: purchasesStatus.inCart }).lean()
}

module.exports = {
    findCartById
}

