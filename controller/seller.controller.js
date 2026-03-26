import User from '../model/user.model.js';
import tempUser from '../model/tempUser.model.js';
import { generateOTP } from '../utils/otpGenerator.js';
import { sendMail } from '../utils/sendMail.js';
import product from '../model/product.model.js';
import categories from '../model/category.model.js';
import cloudinary from "../config/cloudinary.js";
import order from '../model/order.model.js'
import generateToken from '../utils/jwt.js'


const cookieOption = {
    maxAge: 7*24*60*60*1000, // 7 days
    httpOnly: true,
    secure: true,
}

export const sellerRegister = async (req, res, next) => {
    console.log('Seller Register')
    try{
        const { firstName, lastName,  email,  password, confirmPassword } = req.body;
        if (!firstName || !email ||  !password ) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if(password !== confirmPassword){
            return res.status(400).json({message: 'password and confirm Password not same'})
        }

        const seller = await User.findOne({email, userType: 'seller'})
        if(seller){
            console.log('email is already registered')
            return res.status(404).json({
                success: false,
                message: 'email is already registered'                
            })
       }

        const otp = await generateOTP(); 
        if(!otp){
           return res.status(500).json({ message: 'Error generating OTP' });
        }

        const temp_User = await tempUser.create({
            firstName,
            lastName,
            email,
            password, 
            otp,
            otpCreatedAt: Date.now(),
            otpExpire: Date.now() + 1 * 60 * 1000  // otp valid for 1 minute
       })


       let message =  `<p>Your OTP for seller registration is <strong style="color: blue; gap: 10px;">${otp}</strong></p>
                  <p>OTP is valid for 10 minutes</p>
              `
       await sendMail(temp_User.email, 'OTP for Seller Registration', message)
       return res.status(200).json({
        success: true,
        message: 'OTP sent to email successfully',
        id: temp_User._id
       })
   
    }catch(e){
        console.error('Error in seller registration: ', e);
        return res.state(500).json({message: 'Internal server error while seller register'})
    }
}

export const otpVerification = async (req, res, next) => {
   try{
    const tempUserId = req.params.id;
    const {otp} = req.body;
    if(!otp){
        return res.status(400).json({ message: 'OTP is required' });
    }
    const temp_User = await tempUser.findById(tempUserId);
    if(!temp_User){
        return res.status(404).json({ message: 'Temp user not found' });
    }

    if(temp_User.otp.toString() !==otp.toString()){
        return res.status(400).json({ message: 'Invalid OTP' });
    }

    if(temp_User.otpExpire < Date.now()){
        return res.status(400).json({ message: 'OTP has expired' });
    }

    const isSellerExist = await User.findOne({ email: temp_User.email, userType: "seller" })
    if(isSellerExist){
        return res.status(400).json({ message: 'Seller already exists' });
    }

    // let isVerified;
    // if(isSellerExist.userType==='seller'){
    //     isVerified = isSellerExist.isVerified = true
    // }

    const seller = await User.create({
        firstName: temp_User.firstName,
        lastName: temp_User.lastName,
        email: temp_User.email,
        password: temp_User.password,
        userType: 'seller',
        isVerified: true
    })  

    const message =  `<p>Dear <strong>${temp_User.firstName}</strong>, your seller registration is successful.</p>
                  <p>Thank you for registering as a seller on our platform.</p>`
                  
    await sendMail(seller.email, '<h1> Seller Registration successful</h1>', message)

    seller.password = undefined;

    const token = generateToken(seller._id, seller.email, seller.userType)
    res.cookie('token', token, cookieOption)
    console.log('token', token)
    return res.status(201).json({
        success: true,
        message: 'Seller registered successfully',
        seller
      })

    }catch(error){
        console.error('Error verifying OTP: ', error);
        return res.status(500).json({ message: 'Internal server error' });
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

export const completeRegistration = async (req, res, next) => {
     try{
        const userId = req.user.id;
        console.log('Completing registration for user: ', userId)
        const{gender, dob, state} = req.body
        if(!gender || !dob || !state){
            return res.status(400).json({message: 'All fields are required'})
        }

        const birthDate = new Date(dob);
        const today = new Date();
        if(birthDate > today){
            return res.status(400).json({message: 'Date of birth cannot be in the future'})
        }

        const ageLimit = new Date();
        ageLimit.setFullYear(ageLimit.getFullYear() - 18);
        if(birthDate > ageLimit){
            return res.status(400).json({message: 'You must be at least 18 years old to register as a seller'})
        }

        const seller = await User.findById({_id: userId})
        if(!seller){
            return res.status(404).json({message: 'Seller not found'})
        }
        seller.gender = gender
        seller.dob = dob
        seller.state = state
        seller.profileCompleted = true
        await seller.save();

        seller.password = undefined;
        return res.status(200).json({
            success: true,
            message: 'Seller profile completed successfully',
            seller
        }) 

    }catch(e){
        console.error('Error completing registration: ', e);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

 
export const addProduct = async (req, res, next) => {
   try{
     console.log("seller user is: ", req.user)
     const sellerId = req.user.id; //  from auth token

     const isVerifiedSeller = await User.findOne(
        {
            $and:[
                {_id: sellerId}, 
                {isVerified: true}, 
                {userType: 'seller'}
            ]
        })

   // console.log("user details is: ", isVerifiedSeller)
    if(!isVerifiedSeller){
          return res.status(403).json({ message: 'Please verify your seller account to add products' });
      }
    
    const { name, description,  price, category, quantity  } = req.body;
   // console.log( typeof(parseFloat(req.body.price)), typeof(category))
    if (!name || !description|| !price || !category || !quantity) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Images are required" });
    }

    const imgeUrls = req.files.map(file => ({
    url: file.path,
    public_id: file.filename
    })); 
  // Extracting the URLs of the uploaded images from the request files. 
  // it contains an array of file objects, and we are mapping through them to get the path (URL) of each uploaded image.

     // console.log('Image URLs: ', imgeUrls)

        let categoryDoc = await categories.findOne({ name: req.body.category });
        if(!categoryDoc){
         categoryDoc = await categories.create({ name: req.body.category })
        }

        const products = await product.create({
        name,  
        description,
        images: imgeUrls,
        price: Number(req.body.price),
        category: categoryDoc,
        quantity: Number(req.body.quantity), 
        seller: sellerId
        
      })
        return res.status(201).json({ 
            success: true,
            message: 'Product added successfully',
            products
        })

   }catch(e){
    console.error('Error adding product: ', e);
    return res.status(500).json({ message: 'Internal server error during adding product' });
   }
}

//*
export const editProduct = async (req, res, next) => {
    console.log('Editing product with ID: ', req.params.id)
    try{
    const productId = req.params.id;

    const isProductExits = await product.findById(productId)
    if(!isProductExits){
        return res.status(404).json({message: 'Product not found'})
    }
    
    // console.log("user is: ", req.user)
    // console.log("is: ", isProductExits.seller.toString())

     if (isProductExits.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    let imageUrls;
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => ({
        url: file.path,
        public_id: file.filename
      }));
    }
    const { name, description,  price, category, quantity  } = req.body;

   
    const imgeUrls = req.files.map(file => ({
    url: file.path,
    public_id: file.filename
    }));

    const productToUpdate = await product.findByIdAndUpdate(productId,{ 
        name,
        description,
        price,
        category,
        quantity,
    })

    if (!productToUpdate) {
        return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json({
        success: true,
        message: 'Product updated successfully',
    })
   

    }catch(e){
        console.error('Error editing product: ', e);
        return res.status(500).json({ message: 'Internal server error during product editing' });
    }
}

export const removeProduct = async (req, res, next) => {
    try{
        console.log("remove product")
        const productId = req.params.id;

        const isProductExits = await product.findById(productId)
        if (isProductExits.seller.toString() !== req.user.id) {
          return res.status(403).json({ message: "Not authorized" });
       }

        const deletedProduct = await product.findByIdAndDelete(productId);
        //console.log('Product to remove: ', deletedProduct)

        for(const img of deletedProduct.images){ // Looping through the images of the deleted product and deleting them from Cloudinary using their public IDs.
            await cloudinary.uploader.destroy(img.public_id);
        }

        return res.status(200).json({
            success: true,
            message: 'Product removed successfully',
            product: deletedProduct
        }); 
 
    }catch(e){
        console.error('Error removing product: ', e);
        return res.status(500).json({ message: 'Internal server error during product removal' });
    }
}

export const seeAllProducts = async (req, res, next) => {
    try{
    //     console.log("user is: ", req.user)
    //    console.log("seller fetch all products: ", req.user.id)
       const sellerId = req.user.id

        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        const skip = (page - 1) * limit // if page 4 => 4-1*10 => 30 skip

        const totalProducts = await product.countDocuments({seller: sellerId})

        const products = await product.find({seller: sellerId})
        .skip(skip)
        .limit(limit)
       //console.log("product is: ", products)
        if(!products || products.length <=0 ){
        return res.status(404).json({message: 'No any product'})
       }

       return res.status(200).json({
        success: true,
        message: 'fetched all products',
        page,
        limit,
        totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
        products
       })

    }catch(e){
        console.error('error while seller fetch all products: ', e)
        return res.status(500).json({message: 'Internal server error'})
    }
}


// view singile product details
export const viewProduct = async (req, res, next) => {
    console.log("user is: ", req.user)
    try{
     const productId = req.params.id;
     const productDetails = await product.findById(productId)

    if(!productDetails){
        return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({
        success: true,
        message: 'Product details retrieved successfully',
        product: productDetails
    })

    }catch(e){
        console.error('Error viewing product: ', e);
        return res.status(500).json({ message: 'Internal server error during viewing product' });
    }
}

// * check when order implement
export const viewOrders = async (req, res, next) => {
    console.log('seller view order')
   try{
    const sellerId = req.user.id
   // console.log(req.user)
    const totalOrders = await order.find({ status: 'confirmed'})
    .populate('product', 'seller name price images');
    
      const orders = totalOrders.filter(
            ord => ord.product?.seller?.toString() === sellerId ); // ? if exits otherwise null

   // console.log("orders is: ", orders)
    if(orders.length === 0){
        return res.status(404).json({message: 'No order is found yet'})
    }

    // incomplete, img not fetch

    res.status(200).json({
        success: true,
        message: 'total order is fetched successfully',
        orders
    })

   }catch(e){  

   }
}


export const sellerLogin = async (req, res, next) => {
    try{
        console.log("re.user: ", req.user)
        const {email, password} = req.body
        if(!email || !password){
            return res.state(400).json({message: 'please enter login details'})
        }
        const isExists = await User.findOne({email, userType: 'seller'})
        console.log(isExists)
        if(!isExists){
            return res.status(404).json({message: 'incorrect login details'})
        }

        if(password!==isExists.password){
            return res.status(400).json({message: 'Incorrect password'})
        }

        const token = generateToken(isExists._id, isExists.email, isExists.userType)
        res.cookie('token', token, cookieOption)

        isExists.password = undefined
        return res.status(200).json({
            success: true,
            message: 'login successfully',
            seller: isExists,
        })

    }catch(e){
            console.error('error while login ', e)
            return res.status(500).json({message: 'Internal server error'})
        }

}

export const sellerLogout = async (req, res ,next) => {
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