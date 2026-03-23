import mongoose from 'mongoose';

// for single product order
const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
     product: {  
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
   },
    quantity: {
        type: Number,
        default: 1
    },
    totalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'shipped', 'outForDelivery', 'delivered', 'cancelled'],
        default: 'pending'
    },
    address: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Address',
    },

    paymentMethod: {
            type: String,
            enum: ['cashOnDelivery', 'upi']
    },

    paymentStatus: {
        type: String,
        enum: ['pending', 'confirmed', 'failed', 'cashOnDelivery'],
        default: 'pending'
    }

}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;