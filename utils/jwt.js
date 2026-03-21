
import jwt from 'jsonwebtoken'

const token = ( id, email, userType) => {
    return jwt.sign({
      id,
      email,
      userType
    }, process.env.JWT_SECRET,
       {expiresIn: '1d'}
 )
}

export default token