const mongoose = require('mongoose');

const Schema  = mongoose.Schema;

const  orderschema = new Schema({
    products: [
        {
            product : {type : Object , required: true},
            quantity : {type : Number , required : true}
        }
    ],

    user : {
        email : {
            type : String,
            required: true
        },

        userId :{
            type : Schema.Types.ObjectId,
            required : true,
            ref: 'User'
        }
    }

});
const orderSchema = new Schema({
    products: [
        {
            product : {type : Object , required: true},
            quantity : {type : Number , required : true}
        }
    ],

    user : {
        email : {
            type : String,
            required: true
        },
        userId :{
            type : Schema.Types.ObjectId,
            required : true,
            ref: 'User'
        }
        
    },
    paymentDetails: {
      paymentId: { type: String, required: true },
      orderId: { type: String, required: true },
      signature: { type: String, required: true },
      status: { type: String, required: true }
    },
    date: { type: Date, default: Date.now }
  });


module.exports = mongoose.model('Order',orderschema);
