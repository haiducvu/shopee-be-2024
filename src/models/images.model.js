'use strict'

const { model, Schema, Types } = require('mongoose'); // Erase if already required

const DOCUMENT_NAME = 'Image'
const COLLECTION_NAME = 'images'

// Declare the Schema of the Mongo model
const imageSchema = new Schema({
    image_url: {
        type: String,
        required: true
    },
    shop_id: {
        type: String,
        required: true
    },
    product_id: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});

//Export the model
module.exports = model(DOCUMENT_NAME, imageSchema);