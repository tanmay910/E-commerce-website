const express = require('express');
const path = require('path');
const router = express.Router();
const rootdir = require('../utility/path');
const adminController = require('../controllers/admin');
const { check , body } = require('express-validator');

const isAuth = require('../middleware/is_auth');





router.get('/add-product', isAuth, adminController.getAddproducts);

router.get('/products',isAuth, adminController.getProducts);
router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product',[
    body('title').isString().isLength({min:3}).trim(),
    body('price').isFloat(),

    body('description').isLength({min:5,max:300}).trim()

], isAuth, adminController.postEditProduct);

router.post('/add-product', 
    [
        body('title').isString().isLength({min:3}).trim(),
        body('price').isFloat(),
        // body('imageUrl').isURL(),
        body('description').isLength({min:5,max:300}).trim()
]
, isAuth, adminController.postAddproducts);

router.post('/delete-product', isAuth, adminController.postDeleteProduct);
exports.routes = router;








