import User from '../model/user.model.js'
import { sendMail } from '../utils/sendMail.js';
import Product from '../model/product.model.js'
import Review from '../model/reviews.model.js'
import tempUser from '../model/tempUser.model.js'
import generateToken from '../utils/jwt.js'
import {generateOTP} from '../utils/otpGenerator.js'
import Cart from '../model/cart.model.js'
import Address from '../model/address.model.js'
import Order from '../model/order.model.js'

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

  if(user.isVerified===true){
    return res.status(400).json({message: 'account is already verified'})
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

export const deleteCart = async (req, res, next) => {
    try{
      const cartId = req.params.cartId
      //console.log("cart id: ", cartId)
      const userId = req.user.id

      const isCart = await Cart.findOne({user: userId})
     // console.log(isCart)
      if(!isCart){
        return res.status(404).json({message: 'No cart'})
      }
     const deleteCart = await Cart.findByIdAndDelete({_id: cartId})
      return res.status(200).json({
        success: true,
        message: 'cart delete successfully',
        deleteCart
      })

    }catch(e){
        console.error('error while delete cart: ', e)
        return res.status(500).json("Internal server error")
    }
}

export const getProfile = async (req, res, next) => {
    try{
        const userId = req.user.id
        const user = await User.findOne({_id: userId})
        if(!user){
            return res.status(400).json({message: 'not found'})
        }
       const address = await Address.find({user: userId })
      
        user.password = undefined
        return res.status(200).json({
            success: true,
            message: 'user data get successfully',
            user,
            address   
        })

    }catch(e){
        console.error("error while getting profile: ", e)
        return res.status(500).json({message: 'Internal server error'})
    }
}


export const addAddress = async (req, res, next) => {
    try{
        const userId = req.user.id;
        const{country, state, city, pinCode, address, houseNumber, contact} = req.body
        if(!country || !state || !city || !pinCode  || !address, !contact){
            return res.status(400).json({message: 'All fields are required'})
        }
           let createAddress
            createAddress = await Address.create({
                user: userId,
                country,
                state,
                city,
                pinCode,
                address,
                houseNumber, 
                contact,
            })

        return res.status(201).json({
            success: true,
            message: 'address is created',
            createAddress
        })

    }catch(e){
      console.error('error while add address', e)
      return res.status(500).json({message:'Internal server error'})
    }
} 

export const updateAddress = async (req, res, next) => {
    try{
        const AddressId = req.params.id
        const{country, state, city, pinCode, address, houseNumber, contact} = req.body

        const isAddress = await Address.findByIdAndUpdate(AddressId, {
           country: country,
           state: state,
           city: city,
           pinCode: pinCode,
           address: address,
           houseNumber: houseNumber,
           contact: contact
        }, { new: true } //  returns updated document
        )

        if(!isAddress){
            return res.status(400).json({ message: "Address not found" })
        }

        return res.status(200).json({
            success: true,
            message: 'address updated'
        })

    }catch(e){
        console.error('error while updating address: ', e)
        return res.status(500).json({message: 'Internal server error'})
    }
}


export const getOrderPageData  = async (req, res, next) => {
    try{
        const productId = req.params.id
        const userId = req.user.id

        const user=  await User.findById(userId)
        console.log(user.isVerified)
        if(user.isVerified !== true){
            return res.status(400).json({message: 'please verify email id'})
        }
        const product = await Product.findById(productId)
        if(product.quantity === 0 || !product){
            return res.status(400).json({message: 'out of stock'})
        } 

        const address = await Address.findOne({user: userId})
        if(!address){
            return res.status(400).json({message: 'please add address'})
        }

        res.status(400).json({
            success: true,
            message: 'product fetch for order',
            product,
            address,
        })


    }catch(e){
        console.error("error while order: ", e)
        return res.status(500).json({message: 'Internal server error'})
    }
}

export const createOrder = async (req, res, next) => {
    try{
        const userId = req.user.id
        const productId = req.params.id
        if(!productId){
            return res.status(404).json({message: 'product not found'})
        }
        const product = await Product.findById(productId)
        if(!product){
            return res.status(404).json({message: 'product not found'})
        }
       const address = await Address.findOne({user: userId})

       if(!address){
        const{country, state, city, pinCode, address, houseNumber, contact} = req.body
        if(!country || !state || !city || !pinCode  || !address, !contact){
            return res.status(400).json({message: 'All fields are required'})
        }
               createAddress = await Address.create({
                user: userId,
                country,
                state,
                city,
                pinCode,
                address,
                houseNumber, 
                contact,
            })
            res.status(201).json({message: 'address created'})
        }

        const {quantity} = req.body      
        let totalPrice = product.price * (quantity || 1)
        console.log("total price: ", totalPrice)

        if(product.quantity < quantity){
            return res.status(400).json({ message: 'Not enough stock' });
        }

        const {paymentMethod} = req.body  // implement using radio button in front end
        if(!paymentMethod){
            return res.status(400).json({message: 'please choose payment method'})
        }
        const order = await Order.create({
              user: userId,
              product: productId,
              quantity: quantity,
              totalPrice: totalPrice,
              status: 'pending',
              address: address._id.toString(),
              paymentMethod: paymentMethod,
              paymentStatus : 'pending'

        })

        return res.status(201).json({
            success: true,
            message: 'Order is create successfully',
            order: order
        })
    }catch(e){
        console.error('error while creating order', e)
        return res.status(500).json({message: 'Internal server error'})
    }
}

export const checkOut = async (req, res, next) => {
    try{
        const orderId = req.params.orderId
        const order = await Order.findById(orderId).populate('product')
        if (!order) {
            return res.status(400).json({ message: 'No order found' });
        }
        if(order.status==='confirmed'){
            return res.status(400).json({message: 'order is already confirmed'})
        }
       // console.log("order is: ", order)
        if(!order){
            return res.status(400).json({message: 'sorry you have no order '})
        }
        if(order.paymentMethod==="cashOnDelivery"){
            order.status = 'confirmed'
            order.paymentStatus = 'pending' // payment confiremed during the delivery
        }else{
            return res.status(400).json({message: 'upi implement later'})
        }
        // upi implement later

        const product = order.product
        if(product.quantity < order.quantity){
            return res.status(400).json({ message: 'Not enough stock' });
        }
        const totalQunatity  = product.quantity-order.quantity
        //console.log("totalQunatity: ", totalQunatity)
        await Product.findOneAndUpdate(order.product, {
           quantity: totalQunatity
       })
      
        await order.save()
        return res.status(200).json({
           success: true,
           "message": 'order is confirmed successfully',
            order  // in front end show order id and status
        })
    }catch(e){
        console.error("error while checkout" , e)
        return res.status(500).json({message: 'Internal server error'})
    }
}

export const orderHistroy = async (req, res, next) => {
      try{
        const userId = req.user.id
        if(!userId){
            return res.status(400).json({message: 'please login'})
        }
        const orderHistory = await Order.find({user: userId, status: "confirmed"}, )
         .populate("product",  "name description price images" )
         .sort({ createdAt: -1 })
         .populate("address")
        if(!orderHistory){
            return res.status(404).json({message: 'no any order found'})
        }
        return res.status(200).json({
            success: true,
            message: "Order history fetch successfully",
            orderHistory 
        })

      }catch(e){
        console.error("error while fetching order history", e)
        return res.status(500).json({message: "Internal server error"})
      } 
}


