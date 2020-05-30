const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const StringQuerys = require('./../utils/stringQuerys');

exports.deleteOne = Model => catchAsync(async (request, response, next) => {
    const doc = await Model.findByIdAndDelete(request.params.id);
    if(!doc) return next(new AppError('No document found with that ID', 404));
    response.status(204).json({
      status:'success',
      data:null
    });

});


exports.updateOne = Model => catchAsync(async (request, response, next) => {
    // const tour = await Tour.findByIdAndUpdate(request.params.id, request.body,{new:true});
    const doc = await Model.findOneAndUpdate(
      {_id: request.params.id},
      request.body,
      {new:true, runValidators:true}
    );
    if(!doc) return next(new AppError('No document found with that ID', 404));
    response.status(200).json({
      status : 'success',
      data:doc
    });

});

exports.createOne = Model => catchAsync (async (request, response, next) => {
  // console.log(request.body);
    const doc = await Model.create(request.body);
    response.status(201).json({
      status : 'success',
      data: doc
    });
});

exports.getOne = (Model, popOptions) => catchAsync(async (request, response, next) => {
  let query = Model.findById(request.params.id);
  if(popOptions) query = query.populate(popOptions);
  const doc = await query;
  if(!doc) return next(new AppError('No document found with that ID', 404));
    //const tour = await Tour.findOne({_id: request.params.id});
    response.status(200).json({
      status : 'success',
      data:doc
    });
});

exports.getAll = Model => catchAsync(async (request, response, next) => {
    let filter = {};
    if(request.params.tourId) filter = {tour: request.params.tourId}
     const stringquery = new StringQuerys(Model.find(filter),request.query)
      .filter().sort().limitfields().paginate();
     const doc = await stringquery.query;
     //.explain();

    response.status(200).json({
      status : 'success',
      result : doc.length,
      data: doc
    });
});
