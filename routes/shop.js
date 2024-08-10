
const shopController = require('../controllers/shop')


const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/is_auth');


router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

router.get('/products/:productId', shopController.getProduct);

router.get('/cart', isAuth, shopController.getCart);
router.post('/cart', isAuth, shopController.postcart);
router.post('/cart-delete-item', isAuth, shopController.postcartDeleteItem);
router.post('/create-order', isAuth, shopController.postOrders);

// // router.get('/checkout',shopController.getCheckout);
router.get('/orders', isAuth, shopController.getOrders);
router.get('/orders/:orderId', isAuth, shopController.getInvoice);

module.exports = router;

