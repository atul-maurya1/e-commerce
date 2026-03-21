import express from 'express';

const adminRoutes = express.Router();

import { adminHome } from '../controller/admin.controller.js';

adminRoutes.get('/', adminHome)


export default adminRoutes;