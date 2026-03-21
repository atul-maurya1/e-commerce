
import jwt from 'jsonwebtoken'

export const isLoggedIn = async (req, res, next) => {
    const {token} = req.cookies
    if(!token){
        return res.status(401).json({message: 'Unauthenticated, please login'})
    }

    const userDetails = await jwt.verify(token, process.env.JWT_SECRET); //decoding token

     req.user = userDetails;
    
     next()
}

export const authorizedRoles = (...roles) => async (req, res, next) => {
   const currentUserRoles = req.user.userType;
   if(!roles.includes(currentUserRoles)){
      return res.status(402).json({message: 'you are not authorized'})
   }
  next()
}
