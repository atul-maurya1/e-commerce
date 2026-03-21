import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        trim: true
    },
    description:{
        type: String,
        required: true,
        trim: true
    },
    images:{
        type: [{
            public_id: String,
            url: String
        }],
    },
    price:{
        type: Number,
        required: true,
        
    },
    quantity:{
        type: Number,
        required: true,
    },
    category:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    isAvailable:{
        type: Boolean,
        default: true,
    },
    seller:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },


}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
export default Product;