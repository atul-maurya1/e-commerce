import User from '../model/user.model.js'
import { sendMail } from '../utils/sendMail.js';
import Product from '../model/product.model.js'
import Review from '../model/reviews.model.js'
import tempUser from '../model/tempUser.model.js'
import generateToken from '../utils/jwt.js'
import {generateOTP} from '../utils/otpGenerator.js'
import Cart from '../model/cart.model.js'



const cookieOption = {
    maxAge: 7*24*60*60*1000, // 7 days
    httpOnly: true,
    secure: true,
}

//*
export const signUp = async (req, res, next) => {
    console.log("buyer signup")
    try{ 
        const {firstName, lastName, email, password, confirmPassword} = req.body
        if(!firstName || !email || !password || !confirmPassword){
            return res.status(400).json({message: 'all fields are required'})
        }

        if(password !== confirmPassword){
            return res.status(400).json({message: 'password and confirm password is not same'})
        }

        const isExists = await User.findOne({$and: [{email: email}, {userType: 'buyer'}]})
       // console.log("is exists: ", isExists)
        if(isExists){
            return res.status(400).json({message: 'email is already exists'})
        }

        const createUser = await User.create({
            firstName,
            lastName,
            email,
            password,  // hash password implemation
            userType: 'buyer'
        })

        createUser.password = undefined
         const token = generateToken(createUser._id, createUser.email, createUser.userType)
       //console.log(token)

       createUser.password = undefined
       res.cookie('token', token, cookieOption)
        res.status(201).json({
            success: true,
            message: 'account created successfully',
            createUser
        })

        const message = `<p>Dear <strong>${createUser.firstName} </strong> <br>
                          Welcome to our website `

        await sendMail(createUser.email, 'Account created successfully', message)


    }catch(e){
        console.error('error while signup buyer',e)
        return res.status(500).json({message: 'Internal server error while buyer signup'})
    }
}

export const login = async (req, res, next) => {
    //console.log("buyer-login")
     try{
        const {email, password} = req.body
        if(!email || !password){
            return res.status(400).json({message: 'all fields are required'})
        }

        const user = await User.findOne({email, userType: 'buyer'})
       // console.log("user is ", user)
        if(!user){
            return res.status(404).json({message: 'User not found'})
        }
        if(password !== user.password){
            return res.status(400).json({message: 'incorrect password'})
        }

       const token = generateToken(user._id, user.email, user.userType)
       //console.log(token)

       user.password = undefined
       res.cookie('token', token, cookieOption)
       return res.status(200).json({
        success: true,
        message: 'buyer login  successfully',
        user,
    })


     }catch(e){
        console.error("error while login: ", e)
        return res.status(500).json({message: 'Internal server error '})
     }
}


export const logout = async (req, res ,next) => {
    try{
      res.cookie('token', null, {
         secure: true,
         maxAge: 0,
         httpOnly: true
      })

      res.status(200).json({
         success: true,
         message: "User logged out seccessfully"
      })

   }catch(e){
      return next (new AppError(e.message, 400))
   }
}


export const homePage = async (req, res, next) => {
    console.log("home page")
    try{
          const page = parseInt(req.query.page) || 1
          const limit = parseInt(req.query.limit) || 10
          
          const skip = (page - 1) * limit // if page 4 => 4-1*10 => 30 skip

          const totalProducts = await Product. countDocuments({status: 'approved'})
            if(!totalProducts){
            return res.status(404).json({message: 'No products found'})
        }
          console.log("total product: ", totalProducts)
          const findProducts = await Product.find({status: 'approved'}).populate("category")
          .skip(skip)
          .limit(limit)

      
        
        return res.status(200).json({
        success: true,
        message: 'products fetched successfully',    
        page,
        limit,
        totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
        findProducts,
        
    })
   }catch(e){
        console.error('error while feching all products for home page')
        return res.status(500).json({message: 'Internal server error'})
    }
}


export const viewProduct = async (req, res, next) => {
    try{
      const productId = req.params.id
      console.log(req.user)
      const product = await Product.findById(productId,)
      .populate("seller", "firstName")
      .populate("category", "name")

    //  console.log("product: ", product.images)
      if(!product || product.status!== 'approved'){
        return res.status(404).json({message: 'product not found'})
      }

      const productReview = await Review.findById(productId)
     
    
      const inStock = product.quantity > 0

      return res.status(200).json({
        success: true,
        message: 'view product',
        product,
        inStock,
        Review: productReview || 'No any Review of this product'
      })

    }catch(e){
        console.error("error while view product: ", e)
        return res.status(500).json({message: 'Internal server error while view product'})
    }
}

export const mailVerfication = async (req, res, next) => {
    console.log("mail verif. ", req.user)
    try{
    const userId = req.user.id;
    const user = await User.findOne({_id: userId, userType: 'buyer'})
     if(!user) {
     return res.status(404).json({ message: "User not found" }); 
  }
  
    console.log("user is ", user)
    const otp = generateOTP()
    if(!otp){
       return res.status(400).json({message: 'otp genration failed'})
    }
   
    const temp = await tempUser.findOneAndUpdate({ email: user.email },
    {
    firstName: user.firstName,
    email: user.email,
    otp: otp.toString(),
    createdAt: Date.now()
  },
     { upsert: true, new: true }  // upsert create if not exsits , otherwise update
 );
  
    const message = `<p> Otp is valid for 1 mintues: <strong>${otp}</strong>`
    await sendMail(user.email, `<h1>Email Verification </h1>`, message )

    return res.status(200).json({  
        success: true,
        message: 'otp send successfully',
        id: temp._id
      })


 }catch(e){
    console.error("error while otp verifaction", e)
    return res.status(500).json({message: 'Internal server error'})
 }
}


export const otpVerification = async (req, res, next) => {
    try{
        const tempId = req.params.id
        const buyerId = req.user.id
        console.log(req.user)
        const{otp} = req.body
        if(!otp){
            return res.status(400).json({message: 'fill the otp'})
        }

        const temp = await tempUser.findById(tempId)
        if(!temp){
            return res.status(400).json({message: 'resend otp again'})
        }

        if(temp.otp.toString() !==otp.toString()){
         return res.status(400).json({ message: 'Invalid OTP' });
        }

        if(temp.otpExpire < Date.now()){
        return res.status(400).json({ message: 'OTP has expired' });
        }

        const user = await User.findByIdAndUpdate(buyerId, {
            isVerified: true
        })

        return res.status(200).json({
            success: true,
            message: 'otp verified successfully',

        })

    }catch(e){
        console.error("error while otp verification: ", e)
        return res.status(500).json({message: "Internal server error"})
    }
}


export const resendOtp = async (req, res, next) => {
    try{
        const tempUserId = req.params.id;
        const temp_User = await tempUser.findById(tempUserId);  
        if(!temp_User){
            return res.status(404).json({ message: 'Temp user not found' });
        }
        const otp = await generateOTP();
        if(!otp){
            return res.status(500).json({ message: 'Error generating OTP' });
        } 
        
        await tempUser.findByIdAndUpdate(tempUserId, { otp, otpCreatedAt: Date.now(), otpExpire: Date.now() + 1 * 60 * 1000 })
        
        let message =  `<p>Your OTP for seller registration is <strong style="color: blue; gap: 10px;">${otp}</strong></p>
                  <p>OTP is valid for 1 minute</p>
              `
        await sendMail(temp_User.email, 'OTP for Seller Registration', message)
        return res.status(200).json({
         success: true,
         message: 'OTP resent to email successfully',
         id: temp_User._id
        })
    }catch(e){
        console.error('Error resending OTP: ', e);
        return res.status(500).json({ message: 'Internal server error' });
    }
}


export const addToCart = async (req, res, next) => {
    try{
        const productId = req.params.id
        const userId = req.user.id
        console.log(userId)

        let cart = await Cart.findOne({ user: userId });
        let quantity =1;
        if(!cart){
            await Cart.create({
            user: userId,
            items: [{
                 product: productId,
                 quantity: quantity
           }]
           
           })
           return res.status(200).json({message: 'product add to cart'})
        }

      const cartItem = cart.items.find(  
        item => item.product.toString() === productId // (arrow fun.) check every single element of array whole id is same
      )
      // return object
    //  console.log("cart index: ", cartItem)

      if(cartItem){
        cartItem.quantity += 1;
      }
      else{
        cart.items.push({
             product: productId,
             quantity: quantity
        })
      }
       
      await cart.save()
      res.status(200).json({cart, message: 'product add to cart'})
 
    }catch(e){
        console.error("error while add to cart: ", e)
        return res.status(500).json("Internal server error")
    }
}

export const seeCart = async(req, res, next) => {
    try{
       const userId = req.user.id
       const cart = await Cart.findOne({ user: userId }).populate("items.product"); 

       //console.log(req.user.id)
       if(!cart){
        return res.status(404).json({message: 'No Cart Product'})
       }

       return res.status(200).json({
        success: true,
        message: 'cart products',
        cart
       })

    }catch(e){
        console.error('error while fetching cart details: ', e)
        return res.status(500).json({message: "Internal server error"})
    }
} 
   

export const removeToCart = async (req, res, next) => {
    try{
        const userId = req.user.id
        const productId = req.params.id

        const cart = await Cart.findOne({user: userId})
        if(!cart){
            return res.status(404).json({message: "NO cart product"})
        }

        //find index
        const cartIndex = cart.items.findIndex(
           item => item.product.toString() === productId
        )

        // decresase 
        if(cart.items[cartIndex].quantity > 1){
           cart.items[cartIndex].quantity -=1 
        }else{
             // remove item completely if 1
             cart.items.splice(cartIndex, 1);
        }

        await cart.save()

        return res.status(200).json({
            success: true,
            message: 'cart prodcut remove'
        })


    }catch(e){
        console.log("error while removing cart items: " , e)
        return res.status(500).json({message: "Internal server error"})
    }
}





