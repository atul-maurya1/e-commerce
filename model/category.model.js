import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({

    name: {
        type: String,
        enum: ['electronics', 'clothing', 'home appliances', 'books', 'toys', 'sports equipment', 'beauty products', 'accessories'],
        required: true,
    }

}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);
export default Category; 