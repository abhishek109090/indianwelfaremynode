const express = require("express")
const app = express();
const port = 9000;
const cors = require('cors')
const bodyParser = require("body-parser");
const mysql = require('mysql');
const AWS = require('aws-sdk');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const multerS3 = require('multer-s3')
const upload = multer({ dest: 'uploads/' });
const emp=require('./emp.js')
const te=require('./Team')
const Ma= require('./Main2.js')
const of1=require('./Admin.js')

const of=require('./Offer')
const pa=require('./Payslip')
const jwt = require('jsonwebtoken');
require('dotenv').config();
const pool = mysql.createPool({
    // connectionLimit: 10, // Adjust as needed
    host: '107.180.116.73',
    port: '3306',
    user: 'rvlc82',
    password: 'MRVTechnology@123',
    database: 'mrvtech',
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
  const pooladmin = mysql.createPool({
    // connectionLimit: 10, // Adjust as needed
    host: '107.180.116.73',
    port: '3306',
    user: 'rvlc82',
    password: 'MRVTechnology@123',  
    database: 'Admin',
  });
  
  pooladmin.getConnection((err, connection) => {
    if (err) {
        console.error('Error getting connection from pool', err);
        return; 
    }
    
    console.log('Connected to database');
    connection.release();  
  });    
  
  pooladmin.on('error', (err) => {
    console.error('DB pool error', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        // Reconnect to the database
        pooladmin.getConnection((err, connection) => {
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
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended:true,
}))
app.set('maxHeaderSize',655369);

app.use(cors());
app.use(cors({
    origin:'*',
    methods:['GET','POST','PUT','DELETE'],
    allowedHeaders:['origin','x-Requested-with','content-type','Accept','Authorization']
}))

// app.get('/',(req,res)=>{
//     res.send("hello world")
// })
app.get('/', async(req,res)=>{
    console.log('this')
    try{
    const result = await pool.query('select * from "UserForm"')
    res.json(result.rows)
    console.log(res.json(result.rows))  
    }
    catch(err){ 
   
    }
    })
    const secretKey = 'yourSecretKey';

  
    const verifyToken = (req, res, next) => {
      const authHeader = req.headers.authorization;
      
    
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token not provided' });   
      }
    
          
      const token = authHeader.split(' ')[1];  
    
      jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {    
             
          return res.status(403).json({ message: 'Invalid token' });
        }
    
       
       
    
        req.user = decoded;
       
        next();
      });
    };
    const authenticateUser = (request, response) => {  
        const { username, password } = request.body;
      console.log(request.body)
        pool.query(
          'SELECT * FROM login WHERE username = ? AND password = ?',
          [username, password],
          (error, results) => {
            if (error) {
              throw error;  
            }  
           
           
            if (results && results.length > 0) {
             
              const user = results[0];
              const payload ={};
                
               
              
        
                const now = new Date();
                const expiresInSeconds = ((24 - now.getHours()) * 3600) - (now.getMinutes() * 60) - now.getSeconds();
        
                const token = jwt.sign(payload, secretKey, { expiresIn: expiresInSeconds });              response.status(200).json({ message: 'Authentication successful', user, token });
              console.log('Sent user data:', user,token);
            } else {
              
              response.status(401).json({ message: 'Please enter valid details and try again' });   
            }
          }
        );
        };
        app.post('/validate-token', (req, res) => {
            const { token } = req.body;
          
            if (!token) {
              return res.status(400).json({ isValid: false, message: 'Token is required' });
            }
          
            try {
              const decoded = jwt.verify(token, secretKey);
              console.log('remove')
              return res.status(200).json({ isValid: true, decoded });
            } catch (err) {
                console.log('not')

              return res.status(401).json({ isValid: false, message: 'Invalid token' });
            }
          });


          AWS.config.update({
            accessKeyId: process.env.ACCESS_KEY,
            secretAccessKey: process.env.SECRET_ACCESS_KEY,
            region: process.env.BUCKET_REGION
          });
          
          const s3 = new AWS.S3();


          // const storage = multer.diskStorage({
          //   destination: function (req, file, cb) {
          //     const uploadPath = path.join(__dirname, 'uploads');
          //     if (!fs.existsSync(uploadPath)) {
          //       fs.mkdirSync(uploadPath);
          //     }
          //     cb(null, uploadPath);
          //   },
          //   filename: function (req, file, cb) {
          //     cb(null, Date.now() + path.extname(file.originalname));
          //   }
          // });
          
          // const upload = multer({ storage: storage });
          
          app.post('/joining', upload.single('signature'), (req, res) => {
            const formData = req.body;
            console.log(formData)
            const file = req.file;
          
            if (!file) {
              return res.status(400).send({ message: 'No file uploaded.' });
            }
          
            const fileStream = fs.createReadStream(file.path);
            const contentType = file.mimetype;
            const uploadParams = {
              Bucket: process.env.BUCKET_NAME,
              Key: file.filename,
              Body: fileStream,
              ContentType: contentType,
            };
          
            s3.upload(uploadParams, (err, data) => {
              if (err) {
                console.error('Error uploading file to S3:', err);
                return res.status(500).send({ message: 'Failed to upload file.' });
              }
          
              const signatureUrl = data.Location;
          
              // Save formData and signature URL to MySQL database
              const query = `
                INSERT INTO joining (
                  fullName, gender, dob, nationality, maritalStatus,
                  permanentAddress, currentAddress, telephone, email,
                  emergencyName, relationship, emergencyTelephone, emergencyEmail, emergencyAddress,
                  positionTitle, department, supervisor, joiningDate,
                  school1, degree1, graduationYear1, school2, degree2, graduationYear2,
                  bankName, accountNumber, accountHolder, bankBranch,
                  referenceName1, referenceRelationship1, referenceContact1, referenceEmail1,
                  referenceName2, referenceRelationship2, referenceContact2, referenceEmail2,
                  signature, declarationDate, referenceNumber
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?,?)`;
          
              const values = [
                formData.fullName, formData.gender, formData.dob, formData.nationality, formData.maritalStatus,
                formData.permanentAddress, formData.currentAddress, formData.telephone, formData.email,
                formData.emergencyName, formData.relationship, formData.emergencyTelephone, formData.emergencyEmail, formData.emergencyAddress,
                formData.positionTitle, formData.department, formData.supervisor, formData.joiningDate,
                formData.school1, formData.degree1, formData.graduationYear1, formData.school2, formData.degree2, formData.graduationYear2,
                formData.bankName, formData.accountNumber, formData.accountHolder, formData.bankBranch,
                formData.referenceName1, formData.referenceRelationship1, formData.referenceContact1, formData.referenceEmail1,
                formData.referenceName2, formData.referenceRelationship2, formData.referenceContact2, formData.referenceEmail2,
                signatureUrl, formData.declarationDate, formData.referenceNumber
              ];
          
              pool.query(query, values, (err, result) => {
                if (err) {
                  console.error('Failed to insert data into MySQL:', err);
                  return res.status(500).json({ message: 'Failed to submit the form.' });
                }
          console.log(formData.id)
                // Update the offer table based on the random value
                const updateOfferQuery = 'UPDATE offer SET joining = ? WHERE id = ?';
                const updateValues = ['active', formData.id];
          
                pool.query(updateOfferQuery, updateValues, (err, result) => {
                  if (err) {
                    console.error('Failed to update offer table:', err);
                    return res.status(500).json({ message: 'Failed to update offer table.' });
                  }
          
                  res.status(200).json({ message: 'Form submitted and offer updated successfully!' });
                });
          
                // Clean up the file from the server after upload
                fs.unlink(file.path, (err) => {
                  if (err) {
                    console.error('Failed to delete temporary file:', err);
                  }
                });
              });
            });
          });
          

          app.get('/fetchjoin',verifyToken, (req, res) => {
            const query = 'SELECT * FROM joining ';
          
            pool.query(query, (err, results) => {
              if (err) {
                return res.status(500).json({ message: 'Failed to fetch data.' });
              }
          
              if (results.length === 0) {
                return res.status(404).json({ message: 'No data found.' });
              }
          
              const data = [];
          
              // Iterate over each record and process it
              results.forEach((record) => {
                const recordData = { ...record }; // Clone the record object
          
                // Generate a pre-signed URL for the image
                const getSignedUrlParams = {
                  Bucket: process.env.BUCKET_NAME,
                  Key: path.basename(record.signature), // Extracting filename from the URL
                };
          
                s3.getSignedUrl('getObject', getSignedUrlParams, (err, url) => {
                  if (err) {
                    console.error('Error generating signed URL:', err);
                    return; // Skip this record if there's an error
                  }
          
                  // Update signature URL with the pre-signed URL
                  recordData.signature = url;
                  
                  // Push the modified record data to the array
                  data.push(recordData);
          
                  // If all records are processed, send the response
                  if (data.length === results.length) {
                    res.status(200).json(data);
                  }
                });
              });
            });
          });
          
          app.put('/updatejoin/:id',verifyToken, (req, res) => {
            const id = req.params.id;
            const {
              fullName, gender, dob, nationality, maritalStatus,
              permanentAddress, currentAddress, telephone, email,
              emergencyName, relationship, emergencyTelephone, emergencyEmail, emergencyAddress,
              positionTitle, department, supervisor, joiningDate,
              school1, degree1, graduationYear1, school2, degree2, graduationYear2,
              bankName, accountNumber, accountHolder, bankBranch,
              referenceName1, referenceRelationship1, referenceContact1, referenceEmail1,
              referenceName2, referenceRelationship2, referenceContact2, referenceEmail2,
              declarationDate, referenceNumber
            } = req.body;  
          
            const query = `
              UPDATE joining
              SET fullName = ?, gender = ?, dob = ?, nationality = ?, maritalStatus = ?,
                  permanentAddress = ?, currentAddress = ?, telephone = ?, email = ?,
                  emergencyName = ?, relationship = ?, emergencyTelephone = ?, emergencyEmail = ?, emergencyAddress = ?,
                  positionTitle = ?, department = ?, supervisor = ?, joiningDate = ?,
                  school1 = ?, degree1 = ?, graduationYear1 = ?, school2 = ?, degree2 = ?, graduationYear2 = ?,
                  bankName = ?, accountNumber = ?, accountHolder = ?, bankBranch = ?,
                  referenceName1 = ?, referenceRelationship1 = ?, referenceContact1 = ?, referenceEmail1 = ?,
                  referenceName2 = ?, referenceRelationship2 = ?, referenceContact2 = ?, referenceEmail2 = ?,
                  declarationDate = ?, referenceNumber = ?
              WHERE id = ?
            `;
          
            const values = [
              fullName, gender, dob, nationality, maritalStatus,
              permanentAddress, currentAddress, telephone, email,
              emergencyName, relationship, emergencyTelephone, emergencyEmail, emergencyAddress,
              positionTitle, department, supervisor, joiningDate,
              school1, degree1, graduationYear1, school2, degree2, graduationYear2,
              bankName, accountNumber, accountHolder, bankBranch,
              referenceName1, referenceRelationship1, referenceContact1, referenceEmail1,
              referenceName2, referenceRelationship2, referenceContact2, referenceEmail2,
              declarationDate, referenceNumber, id
            ];
          
            pool.query(query, values, (err, result) => {
              if (err) {
                console.error('Error updating record:', err);
                res.status(500).json({ error: 'Failed to update record.' });
                return;
              }
              res.status(200).json({ message: 'Record updated successfully!' });
            });
          });
          app.get('/getpayslip/:employeeCode', (req, res) => {
  const employeeCode = req.params.employeeCode;

  const query = 'SELECT * FROM payslips WHERE employeeCode = ?';
  pool.query(query, [employeeCode], (err, result) => {
    if (err) {
      console.error('Error fetching payslip:', err);
      return res.status(500).send('Error fetching payslip');
    }
    if (result.length === 0) {
      return res.status(404).send('Payslip not found');
    }
    res.json(result[0]);
  });
});
const authenticateAdmin = (request, response) => {  
  const { AdminEmail, AdminPassword } = request.body;
console.log(request.body)
pooladmin.query(
    'SELECT * FROM Adminof WHERE AdminEmail = ? AND AdminPassword = ?',
    [AdminEmail, AdminPassword],
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
        
  
          const now = new Date();
          const expiresInSeconds = ((24 - now.getHours()) * 3600) - (now.getMinutes() * 60) - now.getSeconds();
  
          const token = jwt.sign(payload, secretKey, { expiresIn: expiresInSeconds });              response.status(200).json({ message: 'Authentication successful', user, token });
        console.log('Sent user data:', user,token);
      } else {
        // Authentication failed
        response.status(401).json({ message: 'Please enter valid details and try again' });   
      }
    }
  );
  };
  const authenticateTeamleader = (request, response) => {  
    const { teamleaderEmail,teamleaderPassword } = request.body;
  console.log(request.body)
  pooladmin.query(
      'SELECT * FROM teamleaders WHERE teamleaderEmail = ? AND teamleaderPassword = ?',
      [teamleaderEmail, teamleaderPassword],
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
          
    
            const now = new Date();
            const expiresInSeconds = ((24 - now.getHours()) * 3600) - (now.getMinutes() * 60) - now.getSeconds();
    
            const token = jwt.sign(payload, secretKey, { expiresIn: expiresInSeconds });              response.status(200).json({ message: 'Authentication successful', user, token });
          console.log('Sent user data:', user,token);
        } else {
          // Authentication failed
          response.status(401).json({ message: 'Please enter valid details and try again' });   
        }
      }
    );
    };
    const authenticateEmployee = (request, response) => {  
      const { employeeemail,emppassword } = request.body;
    console.log(request.body)
    pooladmin.query(
        'SELECT * FROM employee WHERE employeeemail = ? AND emppassword = ?',
        [employeeemail, emppassword],
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
            
      
              const now = new Date();
              const expiresInSeconds = ((24 - now.getHours()) * 3600) - (now.getMinutes() * 60) - now.getSeconds();
      
              const token = jwt.sign(payload, secretKey, { expiresIn: expiresInSeconds });              response.status(200).json({ message: 'Authentication successful', user, token });
            console.log('Sent user data:', user,token);
          } else {
            // Authentication failed
            response.status(401).json({ message: 'Please enter valid details and try again' });   
          }
        }
      );
      };
  app.post('/validate-token', (req, res) => {
      const { token } = req.body;
    
      if (!token) {
        return res.status(400).json({ isValid: false, message: 'Token is required' });
      }
    
      try {
        const decoded = jwt.verify(token, secretKey);
        console.log('remove')
        return res.status(200).json({ isValid: true, decoded });
      } catch (err) {
          console.log('not')

        return res.status(401).json({ isValid: false, message: 'Invalid token' });
      }
    });
   app.get('/activity',verifyToken,Ma.A1);
app.put('/updatePassword',verifyToken,Ma.A2)
app.put('/updateEmployeeStatus', verifyToken,Ma.A3);

app.get('/monthreport',verifyToken,Ma.A4);


  
app.get('/teamleaderactivity',verifyToken,Ma.A5);



app.get('/api/holidays',verifyToken,Ma.A6);

// Add a holiday
app.post('/api/holidays', verifyToken,Ma.A7);

// Delete a holiday
app.delete('/api/holidays/:id',verifyToken, Ma.A8);
app.get('/holidays', verifyToken,Ma.A9);
app.post('/trackactivity',verifyToken,Ma.A10);
app.get('/tasks/:emp_id',verifyToken,Ma.A11);
app.post('/checkendwork',verifyToken, Ma.A12);
app.get('/permissionemp', verifyToken,Ma.A13);
app.post('/updateLoginTime',verifyToken, Ma.A14); 


// Route to update leave records
app.post('/updateLeaveRecords',verifyToken, Ma.A15);


app.post('/login',authenticateAdmin)  
app.post('/teamleaderlogin',authenticateTeamleader)
app.post('/employeelogin',authenticateEmployee)

app.post('/startwork',verifyToken,of1.startwork)
app.post('/endwork',verifyToken,of1.endwork)

app.get('/countteam',verifyToken,of1.teamleader)
app.get('/countemp',verifyToken,of1.emp)
app.get('/adminteamemp',verifyToken,emp.adminmain)
app.get('/reportdaily',verifyToken,emp.adminmain1)

app.get('/admin/attendance',verifyToken,of1.adminattandence)
app.get('/teamleaders',verifyToken,of1.adminteam1)
app.get('/teamleaders/count',verifyToken,of1.adminteam2)
app.post('/teamleaders',verifyToken,of1.adminteam3)
app.get('/teamleaders',verifyToken,of1.adminemp1)
app.get('/employees/count',verifyToken,of1.adminemp2)
app.post('/employees',verifyToken,of1.adminemp3)
app.get('/attendance',verifyToken,of1.adminemp5)   

app.post('/takeleave',verifyToken,of1.adminemp4)

app.post('/leaverequests',verifyToken,of1.adminleavestatus)
app.get('/leavestatus',verifyToken,of1.adminleaverequest) 
app.post('/teamstartwork',verifyToken,te.startwork)
app.post('/teamendwork',verifyToken,te.endwork)
app.get('/team/attendance',verifyToken,te.teamattandence)
app.get('/teamleaders',verifyToken,te.team1)
app.get('/teamleaders/count',verifyToken,te.team2)
app.post('/teamleaders',verifyToken,te.team3)
app.get('/employees',verifyToken,te.teamemp1)
app.get('/employees/count',verifyToken,te.teamemp2)
app.post('/employees',verifyToken,te.teamemp3)
app.get('/teamattendance',verifyToken,te.teamemp5) 

app.post('/leave',verifyToken,te.leave)
app.get('/fetchleave/:emp_id',verifyToken,te.fetchLeave) 


app.post('/tasks/assign',verifyToken,te.taskpost)
app.post('/tasks/today',verifyToken,te.gettoday)
app.post('/tasks/previous',verifyToken,te.getprevious) 
app.post('/empstartwork',verifyToken,emp.startwork)
app.post('/empendwork',verifyToken,emp.endwork)
app.get('/emp/attendance',verifyToken,emp.empattandence)
app.get('/empattendance',verifyToken,emp.empemp5)
app.post('/login',authenticateUser)

app.get('/fetchoffer',verifyToken,of.fetchoffer)
app.get('/fetchpay',verifyToken,pa.fetchpayslip)

app.post('/verifypass',verifyToken,of.verifypass)

app.put('/updateoffer/:id',verifyToken,of.updateoffer)
app.put('/updatepayslip/:id',verifyToken,pa.updatepayslip)
app.delete('/deletepayslip/:id',verifyToken,pa.deletepayslip)

app.put('/delete-record/:id',verifyToken,of.updatedel)

app.get('/check',of.record)
app.post('/verify',of.verifyuser)
app.post('/payslip',verifyToken, upload.none(),pa.payslip)
app.get('/fetchempname',verifyToken,pa.fetchempname)
app.get('/fetchemp/:name',verifyToken,pa.fetchemp)


app.post('/submit',verifyToken, upload.none(),of.offer)

app.listen(port,()=>{
    console.log(`this is running on this port :${port} `)
})