const http = require('http');
const fs = require('fs');
const routes = require('./routes');
const express = require('express');
const dotenv = require('dotenv');
const cloudinary = require('./config/cloudinary'); 

dotenv.config();



const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const multer = require('multer');


const User = require('./models/users');


const MONGODB_URI = process.env.MONGODB_URI;

const session = require('express-session');
const mongodbStore = require('connect-mongodb-session')(session);

const store = new mongodbStore({
    uri: MONGODB_URI,
    collection : 'sessions'

});








// to filter out routes use extra argument in .use method

//this excutes always as all routes has '/' in its routes
// so we should use routes in proper sequesnces form top to bottom
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const path = require('path');
const rootdir = require('./utility/path');
const error = require('./controllers/error');
const crsf = require('csurf');



// app.engine('handlebars',exphbs());
// app.set('view engine','handlebars');
// app.set('views','views');

const crsfProtection = crsf();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'images'); // Folder where files will be saved
    },
    filename: (req, file, cb) => {
      cb(null, new Date().toISOString() + '-' + file.originalname); // File name
    }
  });

const fileFilter = (req, file, cb) =>
    {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg'){
                 cb(null, true);
    } else{
        cb(null, false);
    }

};



app.set('view engine', 'ejs');
app.set('views', 'views');



app.use(bodyParser.urlencoded({ extended: false }));

app.use(
    multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
  );

app.use(express.static(path.join(__dirname, 'public')));

app.use(session(
    {
        secret:'this is any secret key' ,
        saveUninitialized: false,
         resave: false, 
        //  save: false,
         store : store
        
    }
))


app.use(crsfProtection);
app.use(flash());

app.use((req,res,next)=>{

    res.locals.isAuthenticate = req.session.isLoggedIn;
    res.locals.csrfToken =req.csrfToken();
    next();
        
});


// app.use((req, res, next) => {
//     console.log('Request URL:', req.url);
//     console.log('Session:', req.session);
//     console.log('CSRF Token:', req.csrfToken());
//     next();
// });








app.use((req, res, next) => {

    if(!req.session.user){
       return next();
    }

    User.findById(req.session.user._id)
    .then(user => {
        // throw new Error('dummy');
        if(!user){
            return next(); 
        }
        req.user = user;
        next();
    })
    .catch(err => {
       next(new Error(err));
    });
});






app.use('/admin', adminRoutes.routes);

app.use(shopRoutes);
app.use(authRoutes);




// app.use(error.get404);

// app.use(error.get505);

// res.render is used for templates while sendfile is set for html

app.use((error,req,res,next) => {
    console.log('error:', error);

    res.status(500).render('505', {
        pageTitle:'505',    
        path :'/505',
        isAuthenticate : req.session && req.session.isLoggedIn ? req.session.isLoggedIn : false
    });
});

app.use(error.get404);

mongoose.connect(MONGODB_URI)
    .then((result) => {
        console.log('connect to database');
        
        app.listen(3000);
    }).catch(err => {
        console.log(err);
    })
