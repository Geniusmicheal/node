const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const app = express();

//set security HTTP headers
app.use(helmet());

//limit requests from same Api
const limiter = rateLimit({
  max:100,
  windowMs: 60*60*1000,
  message:'Too many requests from this IP, please tery again in an hour!'
});
app.use('/api',limiter);

//Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb'}));

//Data sanitization against NoSQL query injection
app.use(mongoSanitize());
//Data sanitization against XSS
app.use(xss());
//Prevent parameter pollution
app.use(hpp({
  whitelist:['duration']
}));

// Serving static files
// app.use(express.static(`${__dirname}/public`));
const AppError = require('./utils/appError');

const errorController = require('./controllers/errorController');
const tourRouter = require('./route/tourRoutes');
const userRouter = require('./route/userRoutes');
const reviewRouter = require('./route/reviewRoutes');
//for request details && development logging

if(process.env.NODE_ENV === 'production')app.use(morgan('dev'));


//Test Middleware
app.use((req,res,next) =>{
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

app.use('/api/v1/tours' ,tourRouter);
app.use('/api/v1/users' ,userRouter);
app.use('/api/v1/reviews' ,reviewRouter);

app.all('*',(req,res,next)=>{

  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;
  // next(err);
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
  // res.status(404).json({
  //   status:'fail',
  //   message:
  // });
});

app.use(errorController);
module.exports = app;
