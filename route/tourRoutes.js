const express = require('express');
const authController = require('./../controllers/authController');
const tourController = require('./../controllers/tourControllers');
const reviewRoutes = require('./reviewRoutes');
const router = express.Router();

router.use('/:tourId/reviews',reviewRoutes);
// router.param('id', tourController.checkID);
router.route('/tours-within/:distance/center/:latlng/unit/:unit')
.get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit')
.get(tourController.getDistances);

router.route('/top-5-cheap').get(tourController.aliasTopTours,tourController.getAllTours);
router.route('/tour-stat').get(tourController.statTour);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);
router.route('/').get(authController.protect, tourController.getAllTours)
// .post(tourController.checkBody, tourController.createTour);
.post(tourController.createTour);
router.route('/:id')
.get(tourController.getTour)
.patch(tourController.updateTour)
.delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour);

// router
//   .route('/:tourId/reviews')
//   .post(authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );
module.exports = router;
