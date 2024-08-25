const Product = require('../models/product');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const pdfDocument = require('pdfkit');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const redisClient = require('../config/redis');

const cloudinary = require('../config/cloudinary');
const axios = require('axios');



const RAZOR_PAY_KEY_ID = process.env.RAZOR_PAY_KEY_ID;
const RAZOR_PAY_SECRET = process.env.RAZOR_PAY_SECRET;


const razorpayInstance = new Razorpay({
  key_id: RAZOR_PAY_KEY_ID,
  key_secret: RAZOR_PAY_SECRET,
});


let ITEMS_PER_PAGE = 2;

const Order = require('../models/orders');




exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then(numProducts => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render('shop/product-list',
        {
          prods: products,
          pageTitle: 'Shop',
          path: '/',
          totalProducts: totalItems,
          currentPage: page,
          hasNextPage: ITEMS_PER_PAGE * page < totalItems,
          hasPreviousPage: page > 1,
          nextPage: page + 1,
          previousPage: page - 1,
          lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
        });
    }).catch((err) => {
      console.log(err);
    });
};

exports.getProduct = async (req, res, next) => {
  const prodId = req.params.productId;
  const redisKey = `product_${prodId}`;

  try {
    const cachedProduct = await redisClient.get(redisKey);
    if (cachedProduct) {

      return res.render('shop/product-details', {
        product: JSON.parse(cachedProduct),
        pageTitle: 'Product Details',
        path: '/products',
        isAuthenticate: req.session.isLoggedIn
      });
    }

    const product = await Product.findById(prodId);
    await redisClient.set(redisKey, JSON.stringify(product), 'EX', 3600); // Cache for 1 hour

    res.render('shop/product-details', {
      product: product,
      pageTitle: product.title,
      path: '/products',
      isAuthenticate: req.session.isLoggedIn
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};
// exports.getProduct = (req, res, next) => {
//   const prodId = req.params.productId;
//   Product.findById(prodId)
//     .then(product => {
//       res.render('shop/product-details', {
//         product: product,
//         pageTitle: product.title,
//         path: '/products',
//         isAuthenticate: req.session.isLoggedIn
//       });
//     })
//     .catch(err => console.log(err));
// };



exports.getIndex = (req, res, next) => {
  // Product.find().then((products) => {

  //   res.render('shop/index', {
  //     prods: products,
  //     pageTitle: 'Shop',
  //     path: '/',

  //   });
  // }).catch(() => {
  //   console.log(err);
  // });
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then(numProducts => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render('shop/index',
        {
          prods: products,
          pageTitle: 'Shop',
          path: '/',
          totalProducts: totalItems,
          currentPage: page,
          hasNextPage: ITEMS_PER_PAGE * page < totalItems,
          hasPreviousPage: page > 1,
          nextPage: page + 1,
          previousPage: page - 1,
          lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
        });
    });
}



exports.getCart = async (req, res, next) => {
  const cacheKey = `cart_${req.user._id}`;

  try {
    // Check if the cart data is in the cache
    const cachedCart = await redisClient.get(cacheKey);
    if (cachedCart) {
      console.log('Using cached cart data');
      // Parse the cached data back to JSON
      const products = JSON.parse(cachedCart);

      // Render the cart page using the cached data
      return res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products,
        isAuthenticate: req.session.isLoggedIn
      });
    }

    // If the cache is empty, retrieve the data from the database
    await req.user.populate('cart.items.productId');
    const products = req.user.cart.items;

    // Cache the retrieved data for future requests
    await redisClient.set(cacheKey, JSON.stringify(products), 'EX', 1800); // Cache for 1 hour

    // Render the cart page with the fresh data
    res.render('shop/cart', {
      path: '/cart',
      pageTitle: 'Your Cart',
      products: products,
      isAuthenticate: req.session.isLoggedIn
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};


exports.postcart = (req, res, next) => {
  const prodId = req.body.productId;

  Product.findById(prodId).then(product => {

    return req.user.addtocart(product)
      .then(result => {
        console.log(result);
        res.redirect('/cart');
      });

  })
}

exports.postcartDeleteItem = (req, res, next) => {

  const prodId = req.body.productId;

  return req.user.deletecartItem(prodId)
    .then((result) => {
      res.redirect('/cart');

    }).catch(err => {
      console.log(err);
    });

}



exports.getCheckout = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then((user) => {
      const products = user.cart.items;
      let total = 0;
      products.forEach(p => {
        total += p.quantity * p.productId.price;
      });
      res.render('shop/checkout', {
        path: '/checkout',
        razorpaykeyId: RAZOR_PAY_KEY_ID,
        pageTitle: 'Checkout',
        user: req.user,
        products: products,
        isAuthenticate: req.session.isLoggedIn,
        totalSum: total
      });

    })
    .catch(err => {
      console.log(err);
    });
};

exports.postCreateOrders = async (req, res, next) => {
  // console.log("Create order called");
  // console.log("Create order called");
  // console.log("Request headers:", req.headers);
  // console.log("Request body (raw):", req.body);
  // console.log("Request body (stringified):", JSON.stringify(req.body));

  const { amount, currency, receipt, notes } = req.body;
  // console.log("Extracted amount:", amount, "Type:", typeof amount);

  console.log(amount);
  if (!amount || isNaN(amount)) {

    return res.status(400).json({ error: "Invalid or missing amount" });
  }

  console.log("Amount is here");


  try {
    console.log("Creating order");
    const order = await razorpayInstance.orders.create({

      amount: amount,  // amount in the smallest currency unit (paise)
      currency,
      receipt,
      notes,
    });
    // console.log(order);
    console.log("order statue : :::::", order.status);
    res.status(200).json(order);


  } catch (error) {
    console.log("Error creating order:", error);
    res.status(500).send('Error creating Razorpay order');
  }
};


exports.getOrders = (req, res, next) => {

  const rediskey = `orders_${req.user._id}`;
  try {

    const cachedOrders = redisClient.get(rediskey);
    if (cachedOrders) {
      console.log('Using cached orders data');
      res.render('shop/orders',
        {
          pageTitle: 'Your Orders',
          path: '/orders',
          orders: cachedOrders,
          isAuthenticate: req.session.isLoggedIn
        });
    }


    Order.find({ 'user.userId': req.user._id })
    .then(orders => {

      res.render('shop/orders',
        {
          pageTitle: 'Your Orders',
          path: '/orders',
          orders: orders,
          isAuthenticate: req.session.isLoggedIn
        });

    });
  }
  catch (err) {
    console.log(err);
    next(err);
  }
};

// exports.postOrders = (req, res, next) => {

//   req.user
//     .populate('cart.items.productId')
//     .then((user) => {
//       console.log(user.cart.items);


//       const products = user.cart.items.map(i => {
//         return {
//           quantity: i.quantity,
//           product: { ...i.productId._doc }

//         }
//       });

//       const order = new Order({
//         user: {
//           email: req.user.email,
//           userId: req.user,
//         },

//         products: products

//       });

//       return order.save();

//     }).then(
//       result => {
//         return req.user.clearCart();
//       }
//     )
//     .then(
//       result => {

//         res.redirect('/orders');
//       }
//     ).catch(err => {
//       console.log(err);
//     });


// }


exports.postRazorpayCallback = async (req, res) => {
  console.log("Razorpay Callback called");
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

  const generated_signature = crypto.createHmac('sha256', RAZOR_PAY_SECRET)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest('hex');

  if (generated_signature === razorpay_signature) {
    req.user
      .populate('cart.items.productId')
      .then(async (user) => {
        const products = user.cart.items.map(i => {
          return {
            quantity: i.quantity,
            product: { ...i.productId._doc }
          }
        });

        const order = new Order({
          user: {
            email: req.user.email,
            userId: req.user._id,
          },
          products: products,
          paymentDetails: {
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            signature: razorpay_signature,
            status: 'Successful'
          }
        });

        try {
          const result = await order.save();



        } catch (err) {
          throw new Error(err);
        }
      })
      .then(() => {

        return req.user.clearCart();
      })
      .then(() => {

        res.status(200).json({ success: true, message: 'Order placed successfully' });
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({ error: err.message });
      });
  } else {

    res.status(400).json({ success: false, message: 'Invalid signature' });
  }
};

exports.getInvoice = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    console.log("orderId:::", orderId);
    const order = await Order.findOne({ 'paymentDetails.orderId': orderId });

    console.log("status:::", order.paymentDetails.status);

    if (!order) {
      throw new Error('No order found.');
    }
    if (order.user.userId.toString() !== req.user._id.toString()) {
      throw new Error('Unauthorized');
    }

    const pdfBuffer = await generatePDF(order, orderId);
    const cloudinaryUrl = await uploadToCloudinary(pdfBuffer, orderId);

    // Instead of redirecting, we'll pipe the Cloudinary response to the client
    const response = await axios({
      method: 'get',
      url: cloudinaryUrl,
      responseType: 'stream'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${orderId}.pdf"`);

    response.data.pipe(res);
  } catch (err) {
    next(err);
  }
};

async function generatePDF(order, orderId) {
  return new Promise((resolve, reject) => {
    const pdfDoc = new pdfDocument({ margin: 50 });
    const buffers = [];

    pdfDoc.on('data', buffer => buffers.push(buffer));
    pdfDoc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });
    pdfDoc.on('error', reject);

    // PDF generation code
    pdfDoc.fontSize(20).text('Your Company Name', 50, 50);
    pdfDoc.fontSize(12).text('123 Your Street, City, Country', 50, 80);
    pdfDoc.text('Phone: +1234567890', 50, 100);
    pdfDoc.text('Email: contact@yourcompany.com', 50, 120);
    pdfDoc.moveDown();

    pdfDoc.fontSize(14).text('Invoice', { align: 'center' }).moveDown(1.5);
    pdfDoc.fontSize(12).text(`Order ID: ${orderId}`, 50, 160);
    pdfDoc.text(`Date: ${new Date().toLocaleDateString()}`, 50, 180);
    pdfDoc.text(`Email: ${order.user.email}`, 50, 200);
    pdfDoc.moveDown();

    const headers = ['Item', 'Quantity', 'Unit Price', 'Total'];
    const tableTop = 230;
    const itemHeight = 20;

    headers.forEach((header, i) => {
      pdfDoc.fontSize(12).text(header, 50 + i * 100, tableTop, { width: 90, align: 'center' });
    });

    const rows = order.products.map(prod => [
      prod.product.title,
      prod.quantity,
      `$${prod.product.price.toFixed(2)}`,
      `$${(prod.quantity * prod.product.price).toFixed(2)}`
    ]);

    rows.forEach((row, index) => {
      const y = tableTop + itemHeight * (index + 1);
      row.forEach((text, i) => {
        pdfDoc.text(text, 50 + i * 100, y, { width: 90, align: 'center' });
      });
    });

    const totalPrice = rows.reduce((sum, row) => sum + parseFloat(row[3].substring(1)), 0);
    pdfDoc.fontSize(14).text(`Total Price: $${totalPrice.toFixed(2)}`, 50, tableTop + itemHeight * (rows.length + 2), { align: 'right' });

    pdfDoc.text('Thank you for your business!', 50, 700, { align: 'center' });

    // Finalize the PDF and end the stream
    pdfDoc.end();
  });
}

async function uploadToCloudinary(pdfBuffer, orderId) {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: 'raw',
      public_id: `invoices/${orderId}`,
      format: 'pdf'
    };

    cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) reject(error);
      else resolve(result.secure_url);
    }).end(pdfBuffer);
  });
}

