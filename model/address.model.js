import mongoose from 'mongoose'

const addressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    country: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    state: {
        type: String,
        required: true,
        trim: true,
        lowercase: true        
    },
    city: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    pinCode: {
        type: String,
        required: true,
        trim: true,
    },
    address: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    houseNumber: {
        type: String,
        trim: true,
        uppercase: true,
    },
    contact: {
        type: Number,
        trim: true,
        required: true
    }
},{timestamps: true})

const Address = mongoose.model('Address', addressSchema)
export default Address