// const fs = require('fs');
// const path = require('path');

// const p = path.join(
//   path.dirname(require.main.filename),
//   'data',
//   'products.json'
// );

// module.exports = class Product {
//   constructor(title,imageUrl,description, price ) {
//     this.title = title;
//     this.imageUrl = imageUrl;
//     this.description = description;
//     this.price = price;
//   }

//   static getProductsFromFile(cb) {
//     fs.readFile(p, (err, fileContent) => {
//       if (err) {
//         cb([]);
//       } else {
//         let products = [];
//         if (fileContent.length > 0) {
//           products = JSON.parse(fileContent);
//         }
//         cb(products);
//       }
//     });
//   }

//   save() {
//     Product.getProductsFromFile(products => {
//       products.push(this);
//       fs.writeFile(p, JSON.stringify(products), err => {
//         console.log(err);
//       });
//     });
//   }

//   static fetchAll(cb) {
//     Product.getProductsFromFile(cb);
//   }
// };
