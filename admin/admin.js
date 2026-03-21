import User from '../model/user.model.js'


const createAdmin = async () => {
try {
    const isAdminExist = await User.findOne({ email: process.env.ADMIN_EMAIL })
    if (!isAdminExist) {
            await User.insertOne({
            firstName: 'atul',
            lastName: 'maurya',
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD,
            userType: 'admin'
        })
        console.log('Admin user created successfully');
    }
} catch (error) {
    console.error('Error creating admin user: ', error);
}

}

export default createAdmin; 
     