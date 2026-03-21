import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    items: [{
        product: {  
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
        },
        quantity: {
            type: Number,
        }
    }],
    totalPrice: {
        type: Number,
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'shipped', 'outForDelivery', 'delivered', 'cancelled'],
        default: 'pending'
    },
    address: [{
        state: {
            type: String,
            required: true,
        },
        city:{
            type: String,
            required: true,
        },
        pinCode: {
            type: String,
            required: true,
        },
        street: {
            type: String,
            required: true,
        }
    }]

}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;