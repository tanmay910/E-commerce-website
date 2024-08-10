
const Product = require('../models/product');
const mongodb = require('mongodb');
const { validationResult } = require('express-validator');
const cloudinary = require('../config/cloudinary');

//const { ObjectId }= require('mongodb');


const ObjectId = mongodb.ObjectId;

exports.getAddproducts = (req, res, next) => {

  res.render('admin/edit-product',
    {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      hasError: false,
      editing: false,
      errorMessage: null,
      validationError: []

    });
};

exports.postAddproducts = async (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;

  // Check if an image is attached
  if (!image) {
    console.log('no image', image);
    return res.render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description
      },
      errorMessage: 'Attached file is not an image',
      validationError: [],
    });
  }

  // Validate input fields
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description
      },
      errorMessage: errors.array()[0].msg,
      validationError: errors.array(),
    });
  }

  try {
    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(image.path,{folder: 'products-images', use_filename: true});
    const imageUrl = result.secure_url; // Get the URL of the uploaded image

    console.log(imageUrl);

    // Create a new product
    const product = new Product({
      title: title,
      imageUrl: imageUrl,
      description: description,
      price: price,
      userId: req.user
    });

    // Save the product to the database
    await product.save();
    console.log('Product added');
    res.redirect('/');
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    // .select()
    // .populate()
    .then(
      (products) => {

        res.render('admin/products', {
          prods: products, pageTitle: 'Admin Products',
          path: 'admin/products'
        })
      }
    ).catch((err) => {

      // return res.render('admin/edit-product', {
      //   pageTitle: 'Add Product',
      //   path: '/admin/add-product',
      //   editing: false,
      //   hasError: true,
      //   product: {

      //     title: title,
      //     imageUrl: imageUrl,
      //     price: price,
      //     description: description
      //   },
      //   errorMessage: 'Database action failed',
      //   validationResult: errors.array()
      //     });

      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
};

// for fetching the product and rendering it  and we see product edit page

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;

  Product.findById(prodId)
    // Product.findById(prodId)
    .then(product => {

      if (!product) {
        return res.redirect('/');
      }

      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
        hasError: false,
        errorMessage: null,
        validationError: []
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};


// to save in database the edited information

// exports.postEditProduct = (req, res, next) => {
//   const prodId = req.body.productId;
//   const updatedTitle = req.body.title;
//   const updatedPrice = req.body.price;
//   const updatedImageUrl = req.body.imageUrl;
//   const updatedDesc = req.body.description;

//   const errors = validationResult(req);

//   if (!errors.isEmpty()) {
//     return res.render('admin/edit-product', {
//       pageTitle: 'Edit Product',
//       path: '/admin/edit-product',
//       editing: true,
//       hasError: true,
//       product: {

//         title: updatedTitle,
//         imageUrl: updatedImageUrl,
//         price: updatedPrice,
//         description: updatedDesc,
//         _id: prodId
//       },
//       errorMessage: errors.array()[0].msg,
//       validationError: errors.array()
//     });
//   }
  

//   Product.findById(prodId).then(product => {
//     if (product.userId.toString() !== req.user._id.toString()) {
//       return res.redirect('/');
//     }

//     product.title = updatedTitle;
//     product.price = updatedPrice;
//     product.description = updatedDesc;
//     product.imageUrl = updatedImageUrl;

//     return product
//       .save().then(result => {
//         console.log('UPDATED PRODUCT!');
//         res.redirect('/admin/products');
//       })
//   })
//     .catch(err => {
//       const error = new Error(err);
//       error.httpStatusCode = 500;
//       return next(error);
//     });
// };
 // Adjust the path as needed

exports.postEditProduct = async (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file;
  const updatedDesc = req.body.description;

  // Validate input fields
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: true,
      hasError: true,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc,
        _id: prodId
      },
      errorMessage: errors.array()[0].msg,
      validationError: errors.array()
    });
  }

  try {
    // Find the product by ID
    const product = await Product.findById(prodId);

    // Check if the user is authorized to edit this product
    if (product.userId.toString() !== req.user._id.toString()) {
      return res.redirect('/');
    }

    // Update product fields
    product.title = updatedTitle;
    product.price = updatedPrice;
    product.description = updatedDesc;

    // Handle image upload and replacement
    if (image) {
      // If there's an existing image, delete it from Cloudinary
      if (product.imageUrl) {
        const oldImageId = product.imageUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(oldImageId);
      }

      // Upload the new image to Cloudinary
      const result = await cloudinary.uploader.upload(image.path,{folder: 'products-images', use_filename: true});
      product.imageUrl = result.secure_url; // Update with the new image URL
    }

    // Save the updated product
    await product.save();
    console.log('UPDATED PRODUCT!');
    res.redirect('/admin/products');
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};


exports.postDeleteProduct = async (req, res, next) => {
  const prodId = req.body.productId;

  try {
    // Find the product to get the image URL
    const product = await Product.findOne({ _id: prodId, userId: req.user._id });

    if (!product) {
      console.log('Product not found');
      return res.redirect('/admin/products');
    }

    // Extract the public ID from the image URL
    const imageUrl = product.imageUrl;
    if (imageUrl) {
      // Extract the public ID from the URL
      const segments = imageUrl.split('/');
      const publicIdWithExtension = segments.slice(7).join('/').split('.').slice(0, -1).join('.');
      
      console.log(`Attempting to delete image with public ID: ${publicIdWithExtension}`);
      
      // Delete image from Cloudinary
      const result = await cloudinary.uploader.destroy(publicIdWithExtension);

      if (result.result === 'ok') {
        console.log('Image deleted from Cloudinary');
      } else {
        console.log('Failed to delete image from Cloudinary:', result);
      }
    } else {
      console.log('No image URL found for the product');
    }

    // Delete the product from the database
    await Product.deleteOne({ _id: prodId, userId: req.user._id });

    console.log('Product deleted');
    res.redirect('/admin/products');
  } catch (err) {
    console.error('Error deleting product or image:', err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};