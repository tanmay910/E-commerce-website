// //const { getOrders } = require('../controllers/shop');
// // const { getdb } = require('../utility/databases');
// const mongodb = require('mongodb');


// const getDb = require('../utility/databases').getdb;



// class Product {

//     constructor(title, imageUrl, description, price,id,userId) {
//         this.title = title;
//         this.imageUrl = imageUrl;
//         this.description = description;
//         this.price = price;
       
//         this._id= id ? new mongodb.ObjectId(id) : null;
//         this.userId= userId;
//     }


//     save() {

//         const db = getDb();
//         let dbops;
        

//         if(this._id){
            
//             dbops=db.collection('products')
//             .updateOne({_id: this._id},{$set: this});

//         }
//         else{
//             // here  we can directly send objects to database in node.js or javascript
//             dbops=db.collection('products').insertOne(this);
//         }
//         return dbops.then(
//             (result) => {
//                 console.log(result);
//             }
//         ).catch(
//             (err) => {
//                 console.log(err);
//             }
//         )
//     }

//     static fetchAll() {

//         const db = getDb();

//         return db.collection('products').find().toArray()
//             .then(
//                 (products) => {
                    
//                     return products;

//                 }
//             ).catch(
//                 (err) => {
//                     console.log(err);
//                 });
//     }

//     static findById(prodId) {
//         const db = getDb();
//         return db.collection('products').
//         find({_id: new mongodb.ObjectId(prodId) })
//         .next() // Use .next() to retrieve the first document that matches the criteria.
//         .then(
//             product =>{
//                 // console.log(products);
//                 // At this point, 'product' contains the first document matching the criteria.
//                 // You can now work with the retrieved document.

//                 // For example, you can log the document to the console:
//                 // console.log(product);

//                 // You can also return the document if you want to use it elsewhere in your code.
//                 return product;
//             }
//         ).catch((err) => {
//             console.log(err);

//         })
//     }

//     static deleteByID(prodId)
//     {
//         const db=getDb();

//         return db.collection('products').deleteOne({_id:new mongodb.ObjectId(prodId)}).then(
//            (result)=> {
//                 console.log("deleted");
//             }
//         ).catch((err)=>{
//             console.log(err);
//         });


//     }



// };

// module.exports = Product;



const mongoose = require('mongoose');

const Schema = mongoose.Schema;


const productSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    price : {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    userId:{
        type: Schema.Types.ObjectId,
        ref:'User',
        required: true
    }

});


module.exports = mongoose.model('Product',productSchema);
