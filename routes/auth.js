const express = require('express');
const authcontroller = require('../controllers/auth');
const User = require('../models/users');

const router = express.Router();

const { check , body } = require('express-validator');


router.get('/login', authcontroller.getLogin);

router.post('/login', [[
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address.').normalizeEmail(),

    body('password', 'Password has to be valid.')
      .isLength({ min: 5 })
      .isAlphanumeric().trim()

  ],],authcontroller.postLogin);

router.post('/logout', authcontroller.postLogout);


router.get('/signup', authcontroller.getSignup);

router.post('/signup',
    [ 
    check('email').isEmail().withMessage('Please add valid email')
    .custom((value, { req }) => {
        // if(value === 'test@test.com'){
        //     throw new Error('Please add email');
        // }
        // return true;


    return User.findOne({ email: value }).then(
        userdoc => {
            if (userdoc) {
                return Promise.reject('Email already exist, please use another email.');
            }
            return true;
        });
    }).normalizeEmail(),
    
    body('password','Password must be atleast 5 characters and alphanumeric').isLength({min: 5}).isAlphanumeric().trim(),

    body('confirmPassword').custom((value, { req }) => { 
        console.log('dfsdf');
        
        if(value !== req.body.password){

            throw new Error('Password have to match');
        }
        return true; 
    }).trim()
]
    , authcontroller.postSignup);


router.get('/reset', authcontroller.getResetPassword);

router.post('/reset', authcontroller.postResetPassword);
router.get('/reset/:token', authcontroller.getNewPassword);
router.post('/new_password', authcontroller.postNewPassword);

// router.post('/reset',authcontroller.postNewPassword)







module.exports = router;
