const fs=require('fs');


const requestHandler = (req,res) =>{

    const url = req.url;
    const method = req.method;
    if (url === '/') {
      res.write('<html>');
      res.write('<head><title>Enter Message</title><head>');
      res.write('<body><form action="/message" method="POST"><input type="text" name="message"><button type="submit">Send</button></form></body>');
      res.write('</html>');
      return res.end();
    }
    if (url === '/message' && method === 'POST') {
      const body =[];
      req.on('data',(chunk)=>{
          console.log(chunk);
          body.push(chunk);

      })

      return req.on('end',()=>{
          /**
           In the context of the provided code, Buffer.concat(body).toString() is used to concatenate the chunks of data in the request body and convert it to a string format.
  
  When an HTTP request is sent to a server, the request may contain a body that contains data sent by the client. 
  This data is typically sent in chunks, and the req.on('data', (chunk) => {...}) event handler is used to handle each incoming chunk of data as it arrives. 
  In this code, the incoming chunks of data are added to an array called body using the push() method.
  
  Once all the chunks of data have been received, the req.on('end', () => {...}) event handler is called to indicate that the entire request body has been received. 
  At this point, the Buffer.concat(body) method is used to concatenate all the chunks of data into a single buffer object, and the .toString() method is then called to convert the buffer to a string format.
  
  After the request body has been converted to a string, the code uses parsedbody.split('=')[1] to extract the value of the 'message' parameter from the request body.
   Finally, the value of 'message' is written to a file named 'message.txt' using the fs.writeFileSync() method.
  
  In summary, Buffer.concat(body).toString() is used to convert the chunks of data received in the
   request body into a single string format that can be parsed and processed by the server.
           */
          const parsedbody = Buffer.concat(body).toString();
          // Buffer allow to hold multiple chunck before they released when you are done.
          
          const message= parsedbody.split('=')[1];
          fs.writeFile('message.txt',message,(err)=>{
            res.statusCode = 302;
            res.setHeader('Location', '/');
            
            return res.end();
          });
            
     
      })
   
    }
    res.setHeader('Content-Type', 'text/html');
    res.write('<html>');
    res.write('<head><title>My First Page</title><head>');
    res.write('<body><h1>Hello from my Node.js Server!</h1></body>');
    res.write('</html>');
    res.end();
  

}
// three ways of export

module.exports.handler=requestHandler;

// module.exports={
//     handler: requestHandler,
// }

// exports.handler=requestHandler;
