// const mongodb = require('mongodb');
// const MongodbClient = mongodb.MongoClient;

// let _db;


// const mongoconnect = (callback) => {

//     MongodbClient.connect('mongodb+srv://tanmay910:Tejas910@cluster0.xknod3m.mongodb.net/?retryWrites=true&w=majority')
//         .then((client) => {
//             console.log('connected to database');
//             _db = client.db('Shop')
//             callback();
//         })
//         .catch((err) => {
//             console.log('here');
            

//             console.log(err)
//         });
// };


// const getdb = () => {
//     if (_db) {
//         return _db;
//     }
//     throw 'No Database Found';

// };


// exports.mongoconnect = mongoconnect;
// exports.getdb = getdb;

