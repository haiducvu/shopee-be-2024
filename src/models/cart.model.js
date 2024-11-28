'user strict'

const { model, Schema } = require('mongoose');

const { PurchaseStatus } = require('../utils/purchasesStatus')

const DOCUMENT_NAME = 'Cart';
const COLLECTION_NAME = 'Carts';

const cartSchema = new Schema({
    // type: Schema.Types.ObjectId,
    cart_state: {
        type: Number,
        required: true,
        enum: [-1, 0, 1, 2, 3, 4, 5],
        default: -1
    },
    cart_products: {
        type: Array,
        required: true,
        default: []
    },
    /**
     * [
     *  {
     *      product_id,
     *      shopId,
     *      quantity,
     *      price,
     *      name,
     *      image
     *   }
     * ]
     */

    cart_count_product: { type: Number, default: 0 },
    cart_userId: { type: String, required: true }
}, {
    collection: COLLECTION_NAME,
    timestamps: {
        createdAt: 'createdOn',
        updatedAt: 'modifiedOn'
    }
});

// module.exports = model('Cart', cartSchema);
module.exports = {
    cart: model(DOCUMENT_NAME, cartSchema)
}

