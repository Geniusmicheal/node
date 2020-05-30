const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');
const router = express.Router({ mergeParams:true });

router.route('/').get(reviewController.getAllTours)
.post(
  authController.protect,
  authController.restrictTo('user'),
  reviewController.setTourIds,
  reviewController.createReview
);

router.route('/:id').delete(reviewController.deleteReview)
.get(reviewController.getReview);

module.exports = router;
