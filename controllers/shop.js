const Product = require('../models/product');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const pdfDocument = require('pdfkit');
const crypto = require('crypto');
const Razorpay = require('razorpay');



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
          .skip((page - 1)*ITEMS_PER_PAGE)
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


exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-details', {
        product: product,
        pageTitle: product.title,
        path: '/products',
        isAuthenticate: req.session.isLoggedIn
      });
    })
    .catch(err => console.log(err));
};



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
        .skip((page - 1)*ITEMS_PER_PAGE)
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

  exports.getCart = (req, res, next) => {


    req.user
      .populate('cart.items.productId')
      .then((user) => {
        console.log(user.cart.items);


        const products = user.cart.items;

        res.render('shop/cart', { path: '/cart', pageTitle: 'Your Cart', products: products, isAuthenticate: req.session.isLoggedIn });
      }).catch(err => {
        console.log(err);
      })

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

  // exports.getCheckout = (req, res, next) => {
    
  //   req.user
  //     .populate('cart.items.productId')
  //     .then((user) => {
  //       // console.log(user.cart.items);
  //       const products = user.cart.items;
  //       let total = 0;
  //       products.forEach(p => {
  //         total += p.quantity * p.productId.price;
  //       });
  //       res.render('shop/checkout', 
  //         { path: '/checkout', 
  //           razorpayKeyId: RAZOR_PAY_KEY_ID,
  //           razorpayOrderId: '',
  //         pageTitle: 'Checkout',
  //          products: products, 
  //          isAuthenticate: req.session.isLoggedIn,
  //          totalSum: total
  //       });

  //     }).catch(err => {
  //       console.log(err);
  //     })

  // };

  

exports.getCheckout = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .then((user) => {
            const products = user.cart.items;
            let total = 0;
            products.forEach(p => {
                total += p.quantity * p.productId.price;
            });

            // Generate Razorpay order
            const options = {
                amount: total * 100, // Convert to paise
                currency: "INR",
                receipt: "receipt_order_74394" // Replace with a dynamic receipt ID
            };

            return razorpayInstance.orders.create(options).then(order => {
                res.render('shop/checkout', {
                    path: '/checkout',
                    razorpayKeyId: RAZOR_PAY_KEY_ID,
                    razorpayOrderId: order.id,
                    pageTitle: 'Checkout',
                    user:req.user,
                    products: products,
                    isAuthenticate: req.session.isLoggedIn,
                    totalSum: total
                });
            });
        })
        .catch(err => {
            console.log(err);
        });
};

  
  exports.getOrders = (req, res, next) => {
    Order.find({ 'user.userId': req.user._id })
      .then(orders => {

        res.render('shop/orders', { pageTitle: 'Your Orders', path: '/orders', orders: orders, isAuthenticate: req.session.isLoggedIn });

      }).catch(err => {
        console.log(err);
      })


  };

  exports.postOrders = (req, res, next) => {

    req.user
      .populate('cart.items.productId')
      .then((user) => {
        console.log(user.cart.items);


        const products = user.cart.items.map(i => {
          return {
            quantity: i.quantity,
            product: { ...i.productId._doc }

          }
        });

        const order = new Order({
          user: {
            email: req.user.email,
            userId: req.user,
          },

          products: products

        });

        return order.save();

      }).then(
        result => {
          return req.user.clearCart();
        }
      )
      .then(
        result => {

          res.redirect('/orders');
        }
      ).catch(err => {
        console.log(err);
      });


  }

 exports.postRazorpayCallback = (req, res) => {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    // Validate the Razorpay signature
    const generated_signature = crypto.createHmac('sha256', RAZOR_PAY_SECRET)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest('hex');

        console.log("Order ID: ", razorpay_order_id);
console.log("Payment ID: ", razorpay_payment_id);
console.log("Generated Signature: ", generated_signature);
console.log("Razorpay Signature: ", razorpay_signature);

        if (generated_signature === razorpay_signature) {
          console.log("Signature validation passed");
          // Proceed with order creation
      } else {
          console.log("Signature validation failed");
          res.status(400).json({ status: 'failed', reason: 'Invalid signature' });
          return;
      }

    if (generated_signature === razorpay_signature) {
        // Signature is valid, save order details to the database
        req.user
            .populate('cart.items.productId')
            .then((user) => {
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

                return order.save().then(result => {
                  console.log("Order saved successfully", result);
              }).catch(err => {
                  console.log("Error saving order:", err);
              });
            })
            .then(() => {
                return req.user.clearCart();
            })
            .then(() => {
                res.status(200).json({ status: 'success' });
            })
            .catch(err => {
                console.log(err);
                res.status(500).json({ error: err.message });
            });
    } else {
        res.status(400).json({ status: 'failed', reason: 'Invalid signature' });
    }
};


  exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;
    Order.findById(orderId)
      .then(order => {
        if (!order) {
          return next(new Error('No order found.'));
        }
        if (order.user.userId.toString() !== req.user._id.toString()) {
          return next(new Error('Unauthorized'));
        }

        const invoiceName = 'invoice-' + orderId + '.pdf';
        const invoicePath = path.join('data', 'invoices', invoiceName);

        const pdfDoc = new pdfDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          'inline; filename="' + invoiceName + '"'
        );

        // Pipe the PDF into a write stream and response
        pdfDoc.pipe(fs.createWriteStream(invoicePath));
        pdfDoc.pipe(res);

        // Add logo and company details
        // pdfDoc.image('path/to/logo.png', 50, 45, { width: 150 }); // Adjust path and size
        pdfDoc.fontSize(20).text('Your Company Name', 50, 50);
        pdfDoc.fontSize(12).text('123 Your Street, City, Country', 50, 80);
        pdfDoc.text('Phone: +1234567890', 50, 100);
        pdfDoc.text('Email: contact@yourcompany.com', 50, 120);
        pdfDoc.moveDown();

        // Add customer and order details
        pdfDoc.fontSize(14).text('Invoice', { align: 'center' }).moveDown(1.5);
        pdfDoc.fontSize(12).text(`Order ID: ${orderId}`, 50, 160);
        pdfDoc.text(`Date: ${new Date().toLocaleDateString()}`, 50, 180);
        // pdfDoc.text(`Customer: ${order.user.name}`); // Assuming order.user has a name field
        pdfDoc.text(`Email: ${order.user.email}`, 50, 200); // Assuming order.user has an email field
        pdfDoc.moveDown();

        // Table headers
        const headers = ['Item', 'Quantity', 'Unit Price', 'Total'];
        const tableTop = 230;
        const itemHeight = 20;

        headers.forEach((header, i) => {
          pdfDoc.fontSize(12).text(header, 50 + i * 100, tableTop, { width: 90, align: 'center' });
        });

        // Table rows
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

        // Add total price
        const totalPrice = rows.reduce((sum, row) => sum + parseFloat(row[3].substring(1)), 0);
        // pdfDoc.text('-----------------------------', 1000, tableTop + itemHeight * (rows.length + 1));
        pdfDoc.fontSize(14).text(`Total Price: $${totalPrice.toFixed(2)}`, 50, tableTop + itemHeight * (rows.length + 2), { align: 'right' });

        // Add footer
        pdfDoc.text('Thank you for your business!', 50, 700, { align: 'center' });

        pdfDoc.end();
      })
      .catch(err => next(err));
  };
