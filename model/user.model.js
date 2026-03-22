import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
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
       // unique:true,
        lowercase:true,
        trim:true,
        ismatch:[ /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address' ],
    },

    password:{
        type:String,
        required:[  true,'Password is required'],
        minlength:[6,'Password must be at least 6 characters long'],
        trim:true,
    },
    userType:{
        type:String,
        enum:['buyer', 'seller', 'admin'],
        
    },

    isVerified: {
        type: Boolean,
        default: false,
    },

    profileCompleted: {
    type: Boolean,
    default: false
  },

   gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: function() {
            return this.profileCompleted === true;
        },
    },
    
    dob: {
        type: Date,
        required: function() {
            return this.profileCompleted === true;
        },
    },

    state:{
        type:String,
        required: function() {
            return this.profileCompleted === true;
        },
    },

    
       

}, { timestamps: true });


userSchema.index({ email: 1, userType: 1 }, { unique: true });


const User = mongoose.model('User', userSchema);
export default User;  