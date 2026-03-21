import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser'


import connectDB from './config/db.js';
import admin from './admin/admin.js';
import adminRoutes from './routes/admin.routes.js';
import buyerRoutes from './routes/buyer.routes.js';
import sellerRoutes from './routes/seller.routes.js';
import {cloudinaryConfig} from './config/cloudinary.js';

const app = express();
dotenv.config();
connectDB() 
admin()
cloudinaryConfig();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser())


app.use('/api/admin', adminRoutes);
app.use('/api/buyer', buyerRoutes);
app.use('/api/seller', sellerRoutes);


app.get('/', (req, res) => { 
    res.send('Server is running')
})


export default app;