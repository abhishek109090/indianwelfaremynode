const express = require('express')
const pg = require('pg')
const bodyParser = require('body-parser')
const app = express()
const mysql = require('mysql');
const multer = require('multer');
const path = require('path');
const cors = require('cors')
const db = require('./login1')
const db5=require('./truck')
const db6=require('./post')
const upload = multer({ dest: 'uploads/' });
const db4=require('./Agent')
const fs = require('fs')
const jwt = require('jsonwebtoken');

const port = 9001
app.use(bodyParser.json())
app.use(
    bodyParser.urlencoded({
        extended: true, 
    })
) 
// const connection = mysql.createConnection({
//   host: '68.178.149.116', 
//   port:'3306',
//   user: 'truckbooking',  
//   password: 'truckbooking',        
//   database: 'truckbooking',    
//   connectTimeout: 30000,         
             
// }); 
const pool = mysql.createPool({
  // connectionLimit: 10, // Adjust as needed
  host: '68.178.149.116',
  port: '3306',
  user: 'truckbooking',
  password: 'truckbooking',
  database: 'truckbooking',
});

pool.getConnection((err, connection) => {
  if (err) {
      console.error('Error getting connection from pool', err);
      return; 
  }

  console.log('Connected to database');
  connection.release();
});

pool.on('error', (err) => {  
  console.error('DB pool error', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      // Reconnect to the database
      pool.getConnection((err, connection) => {
          if (err) {
              console.error('Error getting connection from pool after reconnect', err);
              return;
          }
          console.log('Reconnected to database');
          connection.release();
      }); 
  } else {
      throw err;
  }
});


  app.set('maxHeaderSize', 655369); 
  async function getItems() {
    const pool = mysql.createPool({
      host: 'localhost',   
    port: 5432,
    database: 'login',
    user: 'postgres',
    password: 'Abhi@2001',
    });
  
    const query = 'SELECT * FROM main'; // Change 'main' to your actual table name
  
    return new Promise((resolve, reject) => {
      pool.query(query, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
  
      // Remember to release the pool when you're done with it
      pool.end();
    });
  }
    const allowedOrigins = ['https://trucksbooking.in/' ,'http://localhost:3000']; // Add the origins you want to allow

    // Configure the CORS middleware with the allowed origins
    app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept','Authorization'],
    }));
      
          
       
      const storage = multer.diskStorage({
        destination: function (req, file, cb) {
          cb(null, 'uploads/'); // Specify the directory where uploaded files will be stored.
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname);
        },
      });
      
      app.get("/readfile", async (req, res) => {
        try {
            const data = await fs.promises.readFile('path/to/your/file.txt', 'utf-8');
            res.send(data);
        } catch (error) {
            console.error(error);
            res.status(500).send('Error reading the file');
        }
    });
app.get("/",cors(),async (req,res)=>{
    const data = await getItems()
    console.log("all the details");
     res.send(data)

})
app.get("/api/:option", (req, res) => {
  const option = req.params.option;
  const { from, to } = req.query;

  let query = "";

  if (option === "searchByDateForm") {
    query = `
      SELECT * FROM post
      WHERE from >= $1 AND to <= $2
    `;
  }
  
  const values = [from, to];

  pool.query(query, values, (err, result) => {
    if (err) {
      console.error("Error executing query:", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.status(200).json(result.rows);
    }
  });
});

const getPost=(request,response)=>{
    pool.query('select * from post ',(error,results)=>{
        if(error){
            throw error
        } 
        response.status(200).json(results.rows)
    })
}
const secretKey = 'yourSecretKey';

// Middleware to validate token before accessing API
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token not provided' });   
  }

  // Extract the token from the "Bearer " prefix          
  const token = authHeader.split(' ')[1];  

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {    
         
      return res.status(403).json({ message: 'Invalid token' });
    }

    // The token is valid, you can access the decoded payload here
   

    req.user = decoded;
   
    next();
  });
};
const authenticateUser = (request, response) => {  
  const { phonenumber, password } = request.body;
console.log(request.body)
  pool.query(
    'SELECT * FROM owner1 WHERE phonenumber = ? AND password = ?',
    [phonenumber, password],
    (error, results) => {
      if (error) {
        throw error;  
      }  
     
      // Check if results is defined and has length property
      if (results && results.length > 0) {
        // Authentication successful, return user data
        const user = results[0];
        const payload ={};
          
          // Add other properties as needed
        

        const token = jwt.sign(payload, secretKey, { expiresIn: '300000000' });
        response.status(200).json({ message: 'Authentication successful', user, token });
        console.log('Sent user data:', user,token);
      } else {
        // Authentication failed
        response.status(401).json({ message: 'Please enter valid details and try again' });   
      }
    }
  );
  };
  const authenticateAgent = (request, response) => {
    const { phonenumber, password } = request.body;
  
    pool.query(
      'SELECT * FROM market WHERE phonenumber = ? AND password = ?',
      [phonenumber, password],
      (error, results) => {
        if (error) {
          throw error;
        }
     
        // Check if results is defined and has length property
        if (results.length === 0) {
          // Authentication failed
          response.status(401).json({ message: 'Please enter valid details and try again' });
        } else {
          // Authentication successful, return user data
          const user = results[0];
        const payload ={};
          
          // Add other properties as needed
        

        const token = jwt.sign(payload, secretKey, { expiresIn: '300000000' });
        response.status(200).json({ message: 'Authentication successful', user, token });
        }    
      }
    );
  };
  const authenticateUserAgent = (request, response) => {
    const { agentId, password } = request.body;  
      
    pool.query(
      'SELECT * FROM agent WHERE agentId = ? AND password = ?',
      [agentId, password],     
      (error, results) => {    
        if (error) {     
          throw error;   
        }
    
        if (results.length === 0) {
          // Authentication failed
          response.status(401).json({ message: 'Please enter valid details and try again' });
        } else {
          // Authentication successful, return user data
          const user = results[0];
        const payload ={};
          
          // Add other properties as needed
        

        const token = jwt.sign(payload, secretKey, { expiresIn: '300000000' });
        response.status(200).json({ message: 'Authentication successful', user, token });
        }    
      }
      );  
    };

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  
// Define a route to get an image by filename
app.get('/images/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);

  // Serve the image
  res.sendFile(filePath);
});

app.get('/users',verifyToken, db.getUsers)
app.get('/agentusers',verifyToken, db.getAgentUsers)   
    
app.post('/market',verifyToken,db.createAgent)              
app.put('/updatePassword',db.updateonwer1)                 
app.put('/updatePassword1',db.updateAgent)  
   
app.post('/auth',authenticateUser)
app.post('/authAgent',authenticateAgent)
app.put('/ownerpass',db.ownerPass)
app.put('/agentpass',db.agentPass)
app.post('/verifyemail',db.verifyEmail)
app.post('/verifyemailagent',db.verifyEmailAgent)

app.get('/users/:id',verifyToken, db.getUserById)  
app.post('/users/',verifyToken, db.createUser)      
app.put('/users/:id',verifyToken, db.updateUser)       
app.delete('/users/:id',verifyToken, db.deleteUser)    
app.get('/AgentInfo',verifyToken, db4.getAgentInfo)
app.get('/AgentInfo1',verifyToken, db4.getAgentInfo1)
app.get('/AgentFetch', verifyToken,db4.getAgent)
app.put('/deleteupdate/:agentId', verifyToken,db4.updatedelete)      
    
app.post('/Agentauth', authenticateUserAgent)   
app.get('/Trucks', verifyToken,db4.getTrucks)    
app.get('/getRecords',db4.getDatacollector)    
app.get('/districtPincode',db.getPincodes)    
app.get('/verifyphonenumber/:phonenumber',db.getphonenumber)    

app.post('/addRecord', db4.postdatacollector)         
app.post('/postuser', db4.postuser)         
  
app.get('/Info',verifyToken, db4.getInfo)  
app.get('/sublocations', verifyToken, db5.getSubLocations);
app.get('/checkTruckAvailability/:truckNumber', verifyToken, db6.getTruckpostStatus);

app.post('/addsublocations', verifyToken, db5.createSublocations);
app.get('/sub', verifyToken, db5.getSub);
app.get('/invoice', verifyToken, db5.getinvoice);   

app.delete('/deletesublocations', verifyToken, db5.deleteSubLocations);
app.get('./sublocations/:id', verifyToken, db5.getSubLocationsById);
app.get('/agentType', verifyToken, db4.getAgentType);
app.put('/updateagent', verifyToken, db4.getAgentUpdate);
app.put('/booking/:id/updatePaymentStatus', verifyToken, db5.getPaymentUpdate);
app.get('/table1', verifyToken, db4.getTable1);
app.get('/table2', verifyToken, db4.getTable2);
app.get('/table3', verifyToken, db4.getTable3);
app.get('/Agent', verifyToken, db4.getOwner);
app.get('/Agent/:id', verifyToken, db4.getOwnerById);
app.post('/Agent/', verifyToken, upload.fields([
  { name: 'uploadAadhar', maxCount: 1 },
  { name: 'uploadPan', maxCount: 1 },
]), db4.createOwner);  
app.put('/Agent/:id', verifyToken, db4.updateOwner);
app.delete('/Agent/:id', verifyToken, db4.deleteOwner);
app.get('/PostDate', verifyToken, db6.getPostDate);
app.get('/verifytbr', verifyToken, db5.getSearchTbr);

app.get('/PostTruck', verifyToken, db6.getPostTruck);
app.get('/location', verifyToken, db6.getLocation);
app.get('/Bookings', verifyToken, db4.getBookDate);
app.get('/PostingStatus', verifyToken, db6.getPostStatus);
app.get('/subloc', verifyToken, db6.sublocation);

app.get('/Post', verifyToken, db6.getPost);
app.get('/Post/:id', verifyToken, db6.getPostById);
app.get('/Posting/:id', verifyToken, db6.getPostByTruck);
app.get('/Pincode/:id', verifyToken, db6.getPostBypincode);
app.put('/Pincode/:id', verifyToken, db6.getUpdateBypincode);

app.get('/fetchpincode/:pincode', verifyToken, db6.getPincode);
app.get('/details/:pincode/:sublocation', verifyToken, db6.getSelectedPincode);
app.post('/post/', verifyToken, db.createPost);
app.post('/post1/', verifyToken, db.createPost1);
app.post('/newpost/', verifyToken, db6.createPost);
app.post('/newpost1/', verifyToken, db6.createPost1);
app.post('/addpincodedetails',  db6.addPincodeLocation);


app.put('/Post/:id', verifyToken, db6.updatePost);
app.delete('/Post/:id', verifyToken, db6.deletePost);
app.delete('/Post1/:id', verifyToken, db6.deletePost1);

app.get('/TruckPost/:truckNumber', verifyToken, db6.setPost);
app.get('/checkTruckStatus/:truckNumber', verifyToken, db5.getTruckStatus);

app.get('/truckNumber', verifyToken, db5.getTruckNumber);
app.get('/mobiletruck', db5.getmobiletruck);

app.put('/markdriveravailable/:driverId', verifyToken, db5.Updatedriverstatus);
app.put('/postpaid/:tbr/:crn', verifyToken, db5.updatePaymentstatus);

app.get('/truckNumber2', verifyToken, db5.getTruckNumber2);   
app.get('/truckNumber1', verifyToken, db5.getTruckNumber1);    

app.put('/UpdateTruckStatus', verifyToken, db5.updatetruckStatus);
app.post('/driver', verifyToken, upload.fields([       
  { name: 'licenseFront', maxCount: 1 },              
  { name: 'licenseBack', maxCount: 1 },            
  { name: 'aadharFront', maxCount: 1 },        
  { name: 'aadharBack', maxCount: 1 },  
  { name: 'driverPhoto', maxCount: 1 },  
  { name: 'policeVerificationCertificate', maxCount: 1 },  
  { name: 'healthCertificate', maxCount: 1 },
]), db5.createDriver);

app.get('/fetchdriver', verifyToken, db5.getDriver);
app.get('/verified', verifyToken, db5.getVerified);
app.get('/tbr', verifyToken, db5.getTbr);

app.get('/book', verifyToken, db5.getBook);
app.get('/book/:id', verifyToken, db5.getBookById);
app.post('/book', verifyToken, db5.createBook);
app.delete('/deltruck/:truckNumber', verifyToken, db5.delTruck);
app.get('/booking', verifyToken, db5.getBooking);
app.get('/booking1', verifyToken, db5.getBooking1);
app.post('/check-booking-status', verifyToken, db6.getbookingstatustrack);

app.put('/truckUpdate/:id', verifyToken, db5.updateTruckStatus);
app.put('/loadingstatus/:id', verifyToken, db5.updateLoadingStatus);
app.put('/unloadingstatus/:id', verifyToken, db5.updateunloadingStatus);
app.put('/updatebookingstatus', verifyToken, db5.updateDriverStatus);
app.put('/updatedriverstatus/:id', verifyToken, db5.updateDriverStatus1);
app.post('/addnewrecord', verifyToken, db5.createDriving);

app.put('/booking/:id', verifyToken, db4.deleteBooking);
app.use('/uploads', express.static('uploads'));
app.get('/truck/:crn', verifyToken, db5.getTruck);
app.get('/truckverify', verifyToken, db5.getTruckverification);

app.get('/truckID/:id', verifyToken, db5.getTruckById);
app.post('/Owner', verifyToken, upload.fields([
  { name: 'uploadAadhar', maxCount: 1 },
  { name: 'uploadPan', maxCount: 1 },
]), db.createOwner1);
app.post('/truck', verifyToken, upload.fields([
  { name: 'uploadRegistration', maxCount: 1 },
  { name: 'truckFrontSideWithNumberPlate', maxCount: 1 },
  { name: 'truckBackSideWithNumberPlate', maxCount: 1 },
  { name: 'rightside', maxCount: 1 },
  { name: 'leftside', maxCount: 1 },
  { name: 'truckCabin', maxCount: 1 },
  { name: 'truckOdometer', maxCount: 1 },
  { name: 'truckVideo', maxCount: 1 },
  { name: 'truckPermit', maxCount: 1 },
  { name: 'truckFit', maxCount: 1 },
  { name: 'truckPollutionCertificate', maxCount: 1 },
  { name: 'truckInsuranceCertificate', maxCount: 1 },
  { name: 'truckOwnerPassportSizePhoto', maxCount: 1 },
]), db5.createTruck);   

app.put('/truck/:id', verifyToken, db5.updateTruck);
app.delete('/truck/:id', verifyToken, db5.deleteTruck); 

app.listen(port, () => {
    console.log(`App running on port ${port}.`)
})        

module.exports= app;