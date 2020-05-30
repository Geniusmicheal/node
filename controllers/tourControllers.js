const Tour = require('./../models/tourModel');

const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handleFactory');
// exports.checkID = (req, res, next, val) => {
//   // if(request.params.id * 1 > tours.length){
//   // 	return response.status(404).json({
//   // 		status:'fail',
//   // 		message: 'Invalid Id'
//   // 	});
//   // }
//   next();
// };

// exports.checkBody = (req, res, next) =>{
//   if(!req.body.name || !req.body.price){
//     return res.status(400).json({
//       status:'fail',
//       message:'Missing name or price'
//     });
//   };
//   next();
// }
exports.aliasTopTours=(request, res, next) =>{
  request.query.limit='5';
  request.query.page='2';
  request.query.sort='-ratingsAverage,price';
  request.query.fields='name,price,ratingsAverage,summary,difficulty';
  next();
};


exports.createTour = factory.createOne(Tour);
// exports.createTour = catchAsync (async (request, response, next) => {
//   // console.log(request.body);
//     const newTour = await Tour.create(request.body);
//     response.status(201).json({
//       status : 'success',
//       data: newTour
//     });
// });
exports.getAllTours = factory.getAll(Tour);
// exports.getAllTours = catchAsync(async (request, response, next) => {
//      const stringquery = new StringQuerys(Tour.find(),request.query)
//       .filter().sort().limitfields().paginate();
//      const tours = await stringquery.query;
//
//     response.status(200).json({
//       status : 'success',
//       result : tours.length,
//       data: tours
//     });
// });

exports.getTour = factory.getOne(Tour, { path:'reviews' });
// exports.getTour = catchAsync(async (request, response, next) => {
//   const tour = await Tour.findById(request.params.id)
//   .populate('reviews');
//
//   if(!tour) return next(new AppError('No tour found with that ID', 404));
//     //const tour = await Tour.findOne({_id: request.params.id});
//     response.status(200).json({
//       status : 'success',
//       data:tour
//     });
// });

exports.updateTour  = factory.updateOne(Tour);
// exports.updateTour = catchAsync(async (request, response, next) => {
//     // const tour = await Tour.findByIdAndUpdate(request.params.id, request.body,{new:true});
//     const tour = await Tour.findOneAndUpdate(
//       {_id: request.params.id},
//       request.body,
//       {new:true, runValidators:true}
//     );
//     if(!tour) return next(new AppError('No tour found with that ID', 404));
//     response.status(200).json({
//       status : 'success',
//       data:tour
//     });
//
// });


exports.deleteTour = factory.deleteOne(Tour);
// exports.deleteTour = catchAsync(async (request, response, next) => {
//     const tour = await Tour.findByIdAndDelete(request.params.id);
//     if(!tour) return next(new AppError('No tour found with that ID', 404));
//     response.status(204).json({
//       status:'success',
//       data:null
//     });
//
// });


exports.statTour = catchAsync(async (request, response, next) => {
    const stats =await Tour.aggregate([
      {
        $match: {ratingsAverage: { $gte: 4.5} }
      },
      {
        $group:{
          _id:{$toUpper: '$difficulty'},
          numTours: {$sum:1},
          avgRating:{$avg: '$ratingsAverage'},
          avgPrice: {$avg: '$price'},
          minPrice: {$min: '$price'},
          maxPrice: {$max: '$price'}
        }
      },
      // {
      //   $match:{_id: { $ne: 'EASY'}}
      // },
      {
        $sort:{ avgPrice:1}
      }

    ]);
    response.status(200).json({
      status:'success',
      data: stats
    });

});


exports.getMonthlyPlan = catchAsync(async (request, response, next) =>{

    const year = request.params.year * 1;

    const plan = await Tour.aggregate([
      // to change an array to string
      { $unwind: '$startDates' },
      {
        $match:{
          startDates:{
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group:{
          _id: {$month: '$startDates'},
          numTourStarts: {$sum: 1 },
          tours: { $push: '$name'}
        }
      },
      // to add fields
      {
        $addFields:{ month: '$_id' }
      },
      // to hidden fields when it is 0 and show fields when it is 1
      {
        $project:{
          _id:0
        }
      },
      {
        $sort:{ numTourStarts: -1 }
      },
      { $limit: 12 }
    ]);
    response.status(200).json({
      status:'success',
      data:plan
    });

});

//tours-within/:distance/center/:latlng/unit/:uni
//tour-within/distance/233/center/34.45,-67.34/unit/mi
exports.getToursWithin = catchAsync(async (req,res, next) =>{
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  //earth radius in mile=3963.2 & in km=6378.1;
  const radius = unit === 'mi' ? distance / 3963.2 :distance / 6378.1;
  if(!lat || !lng)
  return next(new AppError('Please provide latitude and longitude in format lat,lng.', 400));
  console.log(distance,lat,lng,unit);

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });
  res.status(200).json({
    status:'success',
    results: tours.length,
    data:{
      tours
    }
  });
});

exports.getDistances = catchAsync(async (req,res, next) =>{
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  if(!lat || !lng)
  return next(new AppError('Please provide latitude and longitude in format lat,lng.', 400));
  console.log(lat,lng,unit);
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates:[lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name:1
      }
    }
  ]);

  res.status(200).json({
    status:'success',
    data:{
      distances
    }
  });

});
