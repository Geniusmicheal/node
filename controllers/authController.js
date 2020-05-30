const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User =  require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');
const factory = require('./handleFactory');


const signToken = userid => {
  return jwt.sign(
    {id:userid },
    process.env.JWT_SECRET,
    {expiresIn: process.env.JWT_EXPIRES_IN}
  );
}

const filterObj = (obj,...allowedFields) =>{
  const newObj= {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};


const createSendToken = (newUser, statusCode, res) => {
  const token = signToken(newUser._id);
  const cookieOptions = {
    expires:new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 *60 * 1000
    ),
    httpOnly: true
  };
  if(process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwtcookie', token, cookieOptions);
  //Remove password from output
  newUser.password =undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: newUser
    }
  });

}

exports.signup = catchAsync (async (request, response, next) => {
  const newUser  = await User.create(request.body);
  createSendToken(newUser,201,response);
  // const token = signToken(newUser._id);
  // response.status(201).json({
  //   status: 'success',
  //   token,
  //   data: {
  //     user: newUser
  //   }
  // });
});

exports.login = catchAsync (async (req,res,next) => {
  const { email, password } =req.body;
  if(!email || !password) return next(new AppError('Please provide email and password!', 400));
  const user = await User.findOne({ email }).select('+password');
  if(!user || !(await user.correctPassword(password,user.password)))
  return next(new AppError('Incorrect email and password!', 401));

  createSendToken(user,200,res);
});


exports.protect = catchAsync (async (request, response, next) => {
  let token;
  if(request.headers.authorization && request.headers.authorization.startsWith('Bearer'))
  token = request.headers.authorization.split(' ')[1];
  if(!token) return next(new AppError('You are not logged in! Please log in to get access', 401));
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const freshUser = await User.findById(decoded.id);
  if(!freshUser) return next(new AppError('The user belonging to this token does no longer exist.', 401));
  if(freshUser.changePasswordAfter(decoded.iat))
  return next(new AppError('User recently changed password! Pease log in again', 401));

  //Grant Access to Protected route
  request.user = freshUser;
  next();
});

exports.restrictTo =(...roles) =>{
  return (req, res, next) => {
      //roles ['admin', 'lead-guide']. role='user'
      if(!roles.includes(req.user.role))
      return next(new AppError('You do not have permission to perform this action', 403));

      next();
  };
};

exports.forgotPassword =catchAsync (async (req, res, next) => {
  const user =await User.findOne({ email: req.body.email });
  if(!user) return next(new AppError('There is no user with email address.', 404));

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false});

  //    3) Send it to user's email
  const resetUrl= `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
  const message= `Forgot your password? Submit a patch request with your new
  password and passwordConfirm to: ${resetUrl}.\nIf you didn't forget your password, please ignore this email!.`;
  try{
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10min)',
      message
    });

    res.status(200).json({
      status:'success',
      message:'Token sent to email!'
    });
  }catch(err){
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false});
    return next(new AppError('There was an error sending the email. Try again later!', 500));
  }

});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the Token
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  // 2)If token has not expired, and there is user, set the new password
  if(!user)return next(new AppError('Token is invalid or has expired',400));
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 3) Update passwordChangedAt property for the user
  //4) log the user in,  send JWT
  createSendToken(user,200,res);

});

exports.updatePassword = catchAsync(async (req,res,next) =>{
  //Get user from collection
  const user = await User.findById(req.user.id).select('+password');
  //check if posted current password is correctPassword
  if(!(await user.correctPassword(req.body.passwordCurrent,user.password)))
  return next(new AppError('Your current password is wrong', 401));

  //if so update password
  user.password = req.body.password;
  user.passwordConfirm =req.body.passwordConfirm;
  await user.save();
  //User.findByIdAndUpdate will not work as intended
  //log user in send Jwt
  createSendToken(user,200,res);

});

exports.updateMe = catchAsync(async (req,res,next) =>{
  if(req.body.password || req.body.passwordConfirm)
  return next(new AppError('This route is not password updates. Please use /updatePassword', 400));

  const filteredBody = filterObj(req.body, 'name','email');
  const upadateuser =await User.findByIdAndUpdate(req.user.id,filteredBody, {
    new: true,
    runValidators:true
  });
  createSendToken(upadateuser,200,res);
});

exports.deleteMe =catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, {active: false});
  res.status(204).json({
    status:'success',
    data:null
  });
});

exports.getMe = (req, res, next) =>{
  req.params.id = req.user.id;
  next();
};
exports.getUser = factory.getOne(User);
