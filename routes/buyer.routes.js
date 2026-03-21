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

buyerRoutes.post('/add-to-cart/:id',  isLoggedIn, authorizedRoles('buyer'), addToCart)
buyerRoutes.get('/cart', isLoggedIn, authorizedRoles('buyer'), seeCart)
buyerRoutes.post('/remove-to-cart/:id', isLoggedIn, authorizedRoles('buyer'), removeToCart)

// buyer profile => order history, add and update add
// add address profile/add address


export default buyerRoutes;