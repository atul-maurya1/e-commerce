
export const generateOTP =  () => {
   const otp = Math.floor(Math.random() * 10000);
    console.log('Generated OTP: ', otp);
    return otp;
}   


