const express = require('express');
const authController = require('./../controllers/authController');
const router = express.Router();

router.post('/signup',authController.signup);
router.post('/login',authController.login);
router.post('/forgotPassword',authController.forgotPassword);
router.patch('/resetPassword/:token',authController.resetPassword);

router.use(authController.protect);
router.get('/me',authController.getMe,authController.getUser);


router.patch('/updatePassword',authController.updatePassword);
router.patch('/updateMe',authController.updateMe);
router.delete('/deleteMe',authController.deleteMe);
// router.route('/signup').post(authController.signup);
module.exports = router;
