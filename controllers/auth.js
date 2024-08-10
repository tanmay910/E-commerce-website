
const User = require('../models/users');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();

const { validationResult } = require('express-validator');



const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: process.env.SENDGRID_API_KEY
    }
}
));



exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }

    // console.log(message);


    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        isAuthenticate: false,
        errorMessage: message,
        oldInput:{
            email: '',
            password: '',
         },
         validationError:[]
    });

}

exports.postLogin = (req, res, next) => {

    const email = req.body.email;
    const password = req.body.password;

    // console.log(email,
    //     password);


    const errors = validationResult(req);

    // console.log(errors.array());

    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('auth/login', {
            path: '/login', pageTitle: 'Login',
             errorMessage: errors.array()[0].msg  ,
             oldInput:{
                email: email,
                password: password,
             },
             validationError: errors.array()
        });
    }

    

    User.findOne({ email: email }).
        then(user => {
            if (!user) {

                return res.status(422).render('auth/login', {
                    path: '/login', pageTitle: 'Login',
                     errorMessage:  'Invalid email or password' ,
                     oldInput:{
                        email: email,
                        password: password,
                     },
                     validationError: errors.array()
                });
            }

            bcrypt.compare(password, user.password).then((isMatch) => {

                if (isMatch) {
                    req.session.isLoggedIn = true;
                    req.session.user = user;
                
                    return req.session.save((err) => {
                        console.log(err);
                        return res.redirect('/');
                    });
                } else {
                    return res.status(422).render('auth/login', {
                        path: '/login', 
                        pageTitle: 'Login',
                        errorMessage: 'Invalid email or password',
                        oldInput: {
                            email: email,
                            password: password,
                        },
                        validationError: errors.array()
                    });
                }

            }).catch(err => {
                console.log(err);
                return res.redirect('/login');
            })


        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
          });
};




exports.getSignup = (req, res, next) => {

    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }


    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        isAuthenticate: false,
        errorMessage: message,
        oldInput:{
            email:'',
            password:'',
        },
        validationError:[]
    });

}

exports.postSignup = (req, res, next) => {

    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const errors = validationResult(req);
    console.log('her');

    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('auth/signup', {
            path: '/signup', pageTitle: 'Signup',
             errorMessage: errors.array()[0].msg,
             oldInput:{
                email: email,
                password: password,
                confirmPassword: confirmPassword
             },
             validationError: errors.array()
        });
    }

    User.findOne({ email: email }).then(
        userdoc => {
            if (userdoc) {
                req.flash('error', 'Email already exist, please use another email.');
                return res.redirect('/signup');
            }

            return bcrypt.hash(password, 12).then((hashpassword) => {
                const user = new User({
                    email: email,
                    password: hashpassword,
                    cart: {
                        items: []
                    }
                })

                return user.save();
            })
                .then((result) => {
                     console.log('ee');    

                    res.redirect('/login');

                    return transporter.sendMail({
                        to: email,
                        from: 'mahajantanmay910@gmail.com',
                        subject: 'Signup succeeded!',
                        html: '<p>Dear [Recipient],</p><p>Thank you for signing up with our service.We are delighted to welcome you aboard!</p><p>Sincerely,<br>Your Company Name</p>'
                    })
                })

        }

    ).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });


}


exports.postLogout = (req, res, next) => {

    req.session.destroy(() => {
        res.redirect('/');
    })
};




exports.getResetPassword = (req, res, next) => {

    let message = req.flash('error');

    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }

    res.render('auth/passwordReset', {
        path: '/reset',
        pageTitle: 'Reset Password',
        errorMessage: message
    });

}


exports.postResetPassword = (req, res, next) => {


    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset');
        }

        const token = buffer.toString('hex');
        User.findOne({ email: req.body.email }).then(
            (user) => {
                if (!user) {
                    req.flash('error', "No Account with that Email Found");
                    return res.redirect('/reset');
                }

                user.resetToken = token;
                user.resetTokenExipry = Date.now() + 3600000;
                return user.save();
            }
        ).then((result) => {
            res.redirect('/');
            return transporter.sendMail({
                to: req.body.email,
                from: 'mahajantanmay910@gmail.com',
                subject: 'Password Reset',
                html: `<p>You Requested the Password Reset</p>
                    
                        <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new pasword </p>
                    `
            });


        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
          });

    })

}


exports.getNewPassword = (req, res, next) => {


    const token = req.params.token;
    User.findOne({ resetToken: token, resetTokenExipry: { $gt: Date.now() } })
        .then((user) => {

            let message = req.flash('error');

            if (message.length > 0) {
                message = message[0];
            } else {
                message = null;
            }

            return res.render('auth/new_password', {
                path: '/new_password',
                pageTitle: 'New Password',
                errorMessage: message,
                userId: user._id.toString(),
                token: token
            });

        })
        .catch(e => { console.log(e) });

}


exports.postNewPassword = (req, res, next) => {

    const new_password = req.body.password;
    const userId = req.body.userId;
    const token = req.body.token;
    let resetUser;

    User.findOne({
        resetToken: token, resetTokenExipry: { $gt: Date.now() }, _id: userId
    }).then((user) => {
        resetUser = user;
        return bcrypt.hash(new_password, 12);
    }
    ).then((hashpassword) => {

        resetUser.password = hashpassword;
        resetUser.resetToken = undefined;
        resetUser.resetTokenExipry = undefined;

        return resetUser.save();

    }
    ).then((result) => {
        console.log('theaa');
        res.redirect('/login');
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });



}