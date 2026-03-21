import mongoose from 'mongoose';

const tempUserSchema = new mongoose.Schema({
    firstName:{
        type:String,
        required:[  true,'First name is required'],
        lowercase:true,
        trim:true,
    },
    lastName:{
        type:String,
        lowercase:true,
        trim:true,
    },
    email:{
        type:String,
        required:[  true,'Email is required'],
        lowercase:true,
        trim:true,
        ismatch:[ /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address' ],
    },
    password:{
        type:String,
        minlength:[6,'Password must be at least 6 characters long'],
        trim:true,
    },
     otp:{
        type: Number,
        required: [true, 'OTP is required'],
     },

     otpCreatedAt: Date,
     otpExpire: Date,

     createdAt: {
     type: Date,
     default: Date.now,
     expires: 60 // MongoDB will auto delete after 1 minute
  }


})

const tempUser = mongoose.model('tempUser', tempUserSchema);
export default tempUser;