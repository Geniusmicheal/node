const Review = require('./../models/reviewsModel');
// const StringQuerys = require('./../utils/stringQuerys');
const catchAsync = require('./../utils/catchAsync');
// const AppError = require('./../utils/appError');
const factory = require('./handleFactory');

exports.getAllTours = catchAsync(async (request, response, next) => {
    let filter = {};
    if(request.params.tourId) filter = {tour: request.params.tourId};
     const reviews = await Review.find(filter);

    response.status(200).json({
      status : 'success',
      result : reviews.length,
      data: { reviews }
    });
});

exports.setTourIds =(request, response, next) => {
  if(!request.body.tour) request.body.tour = request.params.tourId;
  if(!request.body.user) request.body.user = request.user.id;
  next();
};
exports.createReview = factory.createOne(Review);
// exports.createReview = catchAsync (async (request, response, next) => {
//   // console.log(request.body);
//   //Allow nested routes
//   if(!request.body.tour) request.body.tour = request.params.tourId;
//   if(!request.body.user) request.body.user = request.user.id;
//     const newReview = await Review.create(request.body);
//     response.status(201).json({
//       status : 'success',
//       data: newReview
//     });
// });
exports.deleteReview = factory.deleteOne(Review);
exports.getReview = factory.getOne(Review); 
