import express from 'express';

const buyerRoutes = express.Router();

import {
    signUp,
    login,
    logout,
    homePage,
    viewProduct,
    mailVerfication,
    otpVerification,
    resendOtp,
    addToCart,
    seeCart,
    removeToCart,
    getProfile,
    addAddress,
    deleteCart,
    updateAddress,
    orderHistroy,
    getOrderPageData,
    createOrder, 
    checkOut,
} from '../controller/buyer.controller.js'

import {isLoggedIn, authorizedRoles} from '../middleware/auth.js'


buyerRoutes.post('/signup', signUp)
buyerRoutes.post('/login' ,login)
buyerRoutes.post('/logout', isLoggedIn, authorizedRoles('buyer'), logout)


buyerRoutes.get('/home', homePage)
buyerRoutes.get('/view-product/:id', viewProduct)

buyerRoutes.post('/mail-verification', isLoggedIn, authorizedRoles('buyer') ,mailVerfication)
buyerRoutes.post('/otp-verification/:id', isLoggedIn, authorizedRoles('buyer'), otpVerification )
buyerRoutes.post('/resend-otp/:id',  isLoggedIn, authorizedRoles('buyer'), resendOtp)

buyerRoutes.post('/add-to-cart/:id',  isLoggedIn, authorizedRoles('buyer'), addToCart) // + cart item
buyerRoutes.get('/cart', isLoggedIn, authorizedRoles('buyer'), seeCart)
buyerRoutes.post('/remove-to-cart/:id', isLoggedIn, authorizedRoles('buyer'), removeToCart) // - cart item
buyerRoutes.delete('/delete-cart/:cartId', isLoggedIn, authorizedRoles('buyer'), deleteCart) // remove cart (one)

buyerRoutes.get('/profile', isLoggedIn, authorizedRoles('buyer'), getProfile )
buyerRoutes.post('/profile/add-address', isLoggedIn, authorizedRoles('buyer'), addAddress)
buyerRoutes.patch('/update-address/:id' , isLoggedIn, authorizedRoles('buyer'), updateAddress)

buyerRoutes.get('/get-order/:id', isLoggedIn, authorizedRoles('buyer'), getOrderPageData )
buyerRoutes.post('/create-order/:id', isLoggedIn, authorizedRoles('buyer'), createOrder)
buyerRoutes.post('/order-checkout/:orderId', isLoggedIn, authorizedRoles('buyer'), checkOut)

buyerRoutes.get('/profile/order-history', isLoggedIn, authorizedRoles('buyer'),  orderHistroy)

// handle return 

//buyer profile => order history, add and update add


export default buyerRoutes;