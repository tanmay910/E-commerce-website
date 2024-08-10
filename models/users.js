// const mongodb = require('mongodb');
// const { get } = require('../routes/shop');
// const { getdb } = require('../utility/databases');

// const getDb = require('../utility/databases').getdb;
// const ObjectId = mongodb.ObjectId;

// class User {
//     constructor(username, email, cart, userId) {
//         this.name = username;
//         this.email = email;
//         this.cart = cart;
//         this._id = userId; // {items: []}  items key have list of products
//     }



//     save() {
//         const db = getDb();
//         return db.collection('users').insertOne(this);
//     }

//     addtocart(product) {

//         if (!this.cart) {
//             // Initialize cart if not already present
//             this.cart = { items: [] };
//         }

//         const cartproductindex = this.cart.items.findIndex(prod => {
//             return prod.productId.toString() === product._id.toString();
//         });

//         let newquantity = 1;
//         const updatedcartItems = [...this.cart.items];

//         if (cartproductindex >= 0) {
//             newquantity = this.cart.items[cartproductindex].quantity + 1;
//             updatedcartItems[cartproductindex].quantity = newquantity;

//         }
//         else {
//             updatedcartItems.push({
//                 productId: new ObjectId(product._id),
//                 quantity: newquantity
//             });
//         }

//         const updatedcart = { items: updatedcartItems };
//         const db = getDb();
//         return db.collection('users').updateOne({ _id: new ObjectId(this._id) }, { $set: { cart: updatedcart } });


//     }


//     getCart() {
//         const db = getDb();
//         const productIds = this.cart.items.map(i => {
//             return i.productId;
//         });

//         return db
//             .collection('products')
//             .find({ _id: { $in: productIds } })
//             .toArray()
//             .then(products => {
//                 return products.map(p => {
//                     return {
//                         ...p,
//                         quantity: this.cart.items.find(i => {

//                             return i.productId.toString() === p._id.toString();
//                         }).quantity
//                     };
//                 });
//             });
//     }

//     deletcartItems(prodId) {
//         const updatedcartItems = this.cart.items.filter(item => {
//             return item.productId.toString() !== prodId.toString();

//         })

//         const db = getDb();
//         return db.collection('users')
//             .updateOne({ _id: new ObjectId(this._id) },
//                 { $set: { cart: { items: updatedcartItems } } });

//     }

//     addtoOrders() {
//         const db = getDb();

//         return this.getCart()
//             .then(products => {
//                 const order = {
//                     items: products,
//                     user: {
//                         _id: new ObjectId(this._id),
//                         name: this.name,
//                         email: this.email
//                     }
//                 };
//                 return db.collection('orders').insertOne(order);
//             })
//             .then(result => {
//                 this.cart = [];
//                 return db.collection('users')
//                     .updateOne({ _id: new ObjectId(this._id) },
//                         { $set: { cart: { items: [] } } });


//             });

//     }

//     getOrders() {
//         const db = getDb();

//         return db.collection('orders')
//             .find({ 'user._id': new ObjectId(this._id) })
//             .toArray();
//     }

//     static findById(userId) {
//         const db = getDb();
//         return db.collection('users')
//             .findOne({ _id: new ObjectId(userId) });
//     }


// }

// module.exports = User;

const mongoose = require('mongoose');


const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        // required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password : {
        type: String,
        
    },
    resetToken: String,
    resetTokenExipry: Date,
    cart: {
        items: [
            {
                productId: {
                    type: Schema.Types.ObjectId,
                    required: true,
                    ref: 'Product'
                },
                quantity: {
                    type: Number,
                    required: true
                }
            }
        ]
    },


});



// userSchema.methods.addtocart = function (product) {
//     const cartproductindex = this.cart.items.findIndex(prod => {
//         return prod.productId.toString() === product._id.toString();
//     });

//     let newquantity = 1;
//     const updatedcartItems = [...this.cart.items];

//     if (cartproductindex >= 0) {
//         newquantity = this.cart.items[cartproductindex].quantity + 1;
//         updatedcartItems[cartproductindex].quantity = newquantity;

//     }
//     else {
//         updatedcartItems.push({
//             productId: product._id,
//             quantity: newquantity
//         });
//     }
//     const updatedcart = { items: updatedcartItems };

//     this.cart = updatedcart;
//     return this.save();

// }


userSchema.methods.addtocart = function (product) {
    const cartProduct = this.cart.items.find(prod => prod.productId.toString() === product._id.toString());

    if (cartProduct) {
        // If product is already in the cart, increment quantity
        cartProduct.quantity += 1;
    } else {
        // If product is not in the cart, add it with quantity 1
        this.cart.items.push({
            productId: product._id,
            quantity: 1
        });
    }

    // Save the updated cart
    return this.save();
};

userSchema.methods.deletecartItem = function (prodId) {
    const updatedcartItems = this.cart.items.filter(item => {
        return item.productId.toString() !== prodId.toString();

    });
    this.cart.items = updatedcartItems;

    return this.save();

}

userSchema.methods.clearCart = function(){
    this.cart = {items : []};
    return this.save();

}


module.exports = mongoose.model('User', userSchema);
