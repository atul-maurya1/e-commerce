import express from 'express';

const sellerRoutes = express.Router();

import {
       sellerRegister,
       sellerLogin,
       otpVerification,
       resendOtp,
       completeRegistration,
       addProduct,
       editProduct,
       removeProduct,
       viewProduct, 
       viewOrders,
       sellerLogout,
       seeAllProducts,
      } from '../controller/seller.controller.js';

import upload from '../middleware/upload.js';
import {isLoggedIn, authorizedRoles} from '../middleware/auth.js'



sellerRoutes.post('/register', sellerRegister)
sellerRoutes.post('/verify-otp/:id', otpVerification)
sellerRoutes.post('/resend-otp/:id', resendOtp)
sellerRoutes.post('/login', sellerLogin)
sellerRoutes.post('/logout', isLoggedIn, authorizedRoles('seller'), sellerLogout)

sellerRoutes.post('/complete-registration', isLoggedIn, authorizedRoles('seller'), completeRegistration)
sellerRoutes.post('/add-product', isLoggedIn, upload.array("images", 5), authorizedRoles('seller'), addProduct)
sellerRoutes.patch('/edit-product/:id', isLoggedIn, upload.array("images", 5), authorizedRoles('seller'), editProduct)
sellerRoutes.delete('/remove-product/:id', isLoggedIn, authorizedRoles('seller'), removeProduct)
sellerRoutes.get('/my-products', isLoggedIn, authorizedRoles('seller'), seeAllProducts)
sellerRoutes.get('/view-product/:id', isLoggedIn, authorizedRoles('seller'), viewProduct) 

sellerRoutes.get('/view-orders', isLoggedIn, authorizedRoles('seller'), viewOrders)

// handle order=> manage order- view, accept, update order status

// tracks sails, total revenue, total returned=> handle return 

// add payment system 

// update profile => change passwword

//  delete account

// seller dashboard => live product, pending product, total revenue , total order


//show rejected product and edit (again request for live ) and remove it





export default sellerRoutes;