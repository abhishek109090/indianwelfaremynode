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
        const { username, password } = request.body;
      console.log(request.body)
        pool.query(
          'SELECT * FROM login WHERE username = ? AND password = ?',
          [username, password],
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
app.post('/login',authenticateUser)

app.get('/fetchoffer',verifyToken,of.fetchoffer)
app.get('/fetchpay',verifyToken,pa.fetchpayslip)

app.post('/verifypass',verifyToken,of.verifypass)

app.put('/updateoffer/:id',verifyToken,of.updateoffer)
app.put('/delete-record/:id',verifyToken,of.updatedel)

app.get('/check',of.record)
app.post('/verify',of.verifyuser)
app.post('/payslip',verifyToken, upload.none(),pa.payslip)


app.post('/submit',verifyToken, upload.none(),of.offer)
app.get('/cart', (req, res) => {
  const crn = req.query.crn;
console.log(crn)
  const query = 'SELECT * FROM cart WHERE crn = ?';
  pool.query(query, [crn], (err, results) => {
    if (err) {
      console.error('Error fetching cart:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    return res.json(results);
  });
});

// Other routes remain the same
app.post('/insertcart', (req, res) => {
  const { crn, productId, productName, productPrice, productSize, productQuantity, productImage } = req.body;

  if (!crn || !productId || !productName || !productPrice || !productSize || !productQuantity || !productImage) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const query = 'INSERT INTO cart (crn, productId, productName, productPrice, productSize, productQuantity, productImage) VALUES (?, ?, ?, ?, ?, ?, ?)';

  pool.query(query, [crn, productId, productName, productPrice, productSize, productQuantity, productImage], (error, results) => {
    if (error) {
      return res.status(500).json({ success: false, message: 'Database query failed' });
    }
    res.json({ success: true, message: 'Product added to cart', data: results });
  });
});

app.put('/updatecart/:id', (req, res) => {
  const { id } = req.params;
  const { productQuantity } = req.body;

  if (!productQuantity) {
    return res.status(400).json({ success: false, message: 'Product quantity is required' });
  }

  const query = 'UPDATE cart SET productQuantity = ? WHERE id = ?';

  pool.query(query, [productQuantity, id], (error, results) => {
    if (error) {
      return res.status(500).json({ success: false, message: 'Database query failed' });
    }
    res.json({ success: true, message: 'Product quantity updated', data: results });
  });
});

app.get('/search', (req, res) => {
  const query = req.query.query;
  console.log(query);
  pool.query(`SELECT productName FROM products WHERE productName LIKE ? LIMIT 10`, [`%${query}%`], (err, results) => {
    if (err) {
      console.error('Error fetching search results:', err);
      res.status(500).send('Error fetching search results.');
      return;
    }
    console.log(results);
    res.json(results);
  });
});


app.get('/products', (req, res) => {
  const productName = req.query.productName;
  console.log("prosuct",productName)
  pool.query(`SELECT * FROM products ORDER BY CASE WHEN productName = ? THEN 0 ELSE 1 END`, [productName], (err, results) => {
    if (err) {
      console.error('Error fetching products:', err);
      res.status(500).send('Error fetching products.');
      return;
    }
    const productsWithImageUrls = results.map(product => {
      // Construct an array of image URLs based on the new column structure
      const imageUrls = [
        product.productImageUrl1,
        product.productImageUrl2,
        product.productImageUrl3,
        product.productImageUrl4,
        product.productImageUrl5,
        product.productImageUrl6,
        product.productImageUrl7,
        product.productImageUrl8
      ];

      return {
        ...product,
        productImages: imageUrls // Add the image URLs array to the product data
      };
    });

    console.log(productsWithImageUrls); // Debugging line
    res.json(productsWithImageUrls);
  });
});
app.get('/productsbyid/:id', (req, res) => {
  const productId = req.params.id;
  console.log("Product ID:", productId);

  pool.query('SELECT * FROM products WHERE id = ?', [productId], (err, results) => {
    if (err) {
      console.error('Error fetching product:', err);
      res.status(500).send('Error fetching product.');
      return;
    }

    if (results.length === 0) {
      res.status(404).send('Product not found.');
      return;
    }

    const product = results[0];

    const imageUrls = [
      product.productImageUrl1,
      product.productImageUrl2,
      product.productImageUrl3,
      product.productImageUrl4,
      product.productImageUrl5,
      product.productImageUrl6,
      product.productImageUrl7,
      product.productImageUrl8
    ];

    const productWithImages = {
      ...product,
      productImages: imageUrls
    };

    console.log(productWithImages);
    res.json(productWithImages);
  });
});

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
          
         
          app.post('/product', upload.array('productImages', 8), (req, res) => {
            const {
              productId,
              productName,
              productCategory,
              productPrice,
              productQuantity,
              productDescription,
              productSizes,
            } = req.body;
          
            const productImages = req.files;
            if (!productImages || productImages.length === 0) {
              return res.status(400).send('No images uploaded.');
            }
          
            // Upload images to S3
            const s3 = new AWS.S3();
            const uploadPromises = productImages.map((image) => {
              const s3Params = {
                Bucket: process.env.BUCKET_NAME,
                Key: `${Date.now()}_${image.originalname}`,
                Body: image.buffer,
                ContentType: image.mimetype,
              };
          
              return s3.upload(s3Params).promise();
            });
          
            Promise.all(uploadPromises)
              .then((results) => {
                // Collect the image URLs
                const imageUrls = results.map(data => data.Location);
          
                // Prepare the query with individual image columns
                const query = `
                  INSERT INTO products (
                    productId, productName, productCategory, productPrice, productQuantity,
                    productDescription, productImageUrl1, productImageUrl2, productImageUrl3, 
                    productImageUrl4, productImageUrl5, productImageUrl6, productImageUrl7, 
                    productImageUrl8, productSizes
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
          
                const productSizesArray = productSizes.split(',').map(size => size.trim());
                const productSizesJson = JSON.stringify(productSizesArray);
          
                // Map image URLs to columns
                const imageUrlColumns = [
                  imageUrls[0] || null,
                  imageUrls[1] || null,
                  imageUrls[2] || null,
                  imageUrls[3] || null,
                  imageUrls[4] || null,
                  imageUrls[5] || null,
                  imageUrls[6] || null,
                  imageUrls[7] || null
                ];
          
                pool.query(query, [
                  productId, productName, productCategory, productPrice, productQuantity,
                  productDescription, ...imageUrlColumns, productSizesJson
                ], (err, result) => {
                  if (err) {
                    console.error('Error saving to database:', err);
                    return res.status(500).send('Error saving product details');
                  }
          
                  res.send('Product uploaded successfully');
                });
              })
              .catch((err) => {
                console.error('Error uploading images to S3:', err);
                res.status(500).send('Error uploading images to S3');
              });
          });

          app.get('/casual', (req, res) => {
            const { category } = req.query;
            const query = 'SELECT * FROM products WHERE productCategory = ?';
          
            pool.query(query, [category], (err, results) => {
              if (err) {
                console.error('Error fetching products:', err);
                return res.status(500).send('Error fetching products');
              }
          
              const productsWithImageUrls = results.map(product => {
                // Construct an array of image URLs based on the new column structure
                const imageUrls = [
                  product.productImageUrl1,
                  product.productImageUrl2,
                  product.productImageUrl3,
                  product.productImageUrl4,
                  product.productImageUrl5,
                  product.productImageUrl6,
                  product.productImageUrl7,
                  product.productImageUrl8
                ];
          
                return {
                  ...product,
                  productImages: imageUrls // Add the image URLs array to the product data
                };
              });
          
              console.log(productsWithImageUrls); // Debugging line
              res.json(productsWithImageUrls);
            });
          });
app.get('/addresses', (req, res) => {
  const { crn } = req.query;
  const query = 'SELECT * FROM addresses WHERE crn = ?';
  pool.query(query, [crn], (err, results) => {
    if (err) {
      console.error('Error fetching addresses:', err);
      res.status(500).send('Internal server error');
      return;
    }
    res.json(results);
  });
});

app.post('/address', (req, res) => {
  const { crn, fullName, mobileNumber, addressLine1, addressLine2, landmark, pincode, city, state, country, defaultAddress } = req.body;
  const query = 'INSERT INTO addresses (crn, fullName, mobileNumber, addressLine1, addressLine2, landmark, pincode, city, state, country, defaultAddress) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
  pool.query(query, [crn, fullName, mobileNumber, addressLine1, addressLine2, landmark, pincode, city, state, country, defaultAddress], (err, result) => {
    if (err) {
      console.error('Error inserting address:', err);
      res.status(500).send('Internal server error');
      return;
    }
    res.json({ id: result.insertId });
  });
});

app.put('/address/:id', (req, res) => {
  const { id } = req.params;
  const { fullName, mobileNumber, addressLine1, addressLine2, landmark, pincode, city, state, country, defaultAddress } = req.body;
  const query = 'UPDATE addresses SET fullName = ?, mobileNumber = ?, addressLine1 = ?, addressLine2 = ?, landmark = ?, pincode = ?, city = ?, state = ?, country = ?, defaultAddress = ? WHERE id = ?';
  pool.query(query, [fullName, mobileNumber, addressLine1, addressLine2, landmark, pincode, city, state, country, defaultAddress, id], (err) => {
    if (err) {
      console.error('Error updating address:', err);
      res.status(500).send('Internal server error');
      return;
    }
    res.send('Address updated successfully');
  });
});

app.delete('/address/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM addresses WHERE id = ?';
  pool.query(query, [id], (err) => {
    if (err) {
      console.error('Error deleting address:', err);
      res.status(500).send('Internal server error');
      return;
    }
    res.send('Address deleted successfully');
  });
});

app.post('/update-default-address', (req, res) => {
  const { crn, newDefaultId, previousDefaultId } = req.body;

  if (previousDefaultId) {
    const updatePreviousDefaultQuery = 'UPDATE addresses SET defaultAddress = 0 WHERE id = ?';
    pool.query(updatePreviousDefaultQuery, [previousDefaultId], err => {
      if (err) {
        console.error('Error updating previous default address:', err);
        res.status(500).send('Internal server error');
        return;
      }
    });
  }

  const updateNewDefaultQuery = 'UPDATE addresses SET defaultAddress = 1 WHERE id = ?';
  pool.query(updateNewDefaultQuery, [newDefaultId], err => {
    if (err) {
      console.error('Error updating new default address:', err);
      res.status(500).send('Internal server error');
      return;
    }
    res.send('Default address updated successfully');
  });
});
app.post('/service', (req, res) => {
  const { name, serviceDate, serviceTime, serviceLocation, serviceType, serviceItem, phoneNumber, email, callBackTime } = req.body;
console.log(req.body)
  const query = `
      INSERT INTO services (name, serviceDate, serviceTime, serviceLocation, serviceType, serviceItem, phoneNumber, email, callBackTime)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  pool.query(query, [name, serviceDate, serviceTime, serviceLocation, serviceType, serviceItem, phoneNumber, email, callBackTime], (err, result) => {
      if (err) {
          console.error('Error inserting data:', err);
          res.status(500).json({ message: 'Error submitting form' });
      } else {
          res.status(200).json({ message: 'Form submitted successfully' });
      }
  });
});

// Endpoint for admin to update request details
app.put('/serviceupdate/:id', (req, res) => {
  const { id } = req.params;
  const { status, assignedPersonName, assignedPersonMobile, price } = req.body;

  const query = `
      UPDATE services
      SET status = ?, assignedPersonName = ?, assignedPersonMobile = ?, price = ?
      WHERE id = ?
  `;

  pool.query(query, [status, assignedPersonName, assignedPersonMobile, price, id], (err, result) => {
      if (err) {
          console.error('Error updating data:', err);
          res.status(500).json({ message: 'Error updating request' });
      } else {
          res.status(200).json({ message: 'Request updated successfully' });
      }
  });
});
app.post('/requestCallBack', (req, res) => {
  const { phoneNumber, email, callBackTime } = req.body;
  
  if (!phoneNumber || !callBackTime) {
    return res.status(400).json({ message: 'Phone number and callback time are required.' });
  }

  const query = 'INSERT INTO callbackservice (phoneNumber, email, callBackTime) VALUES (?, ?, ?)';
  pool.query(query, [phoneNumber, email, callBackTime], (err, result) => {
    if (err) {
      console.error('Error inserting data:', err);
      return res.status(500).json({ message: 'Server error. Could not submit request.' });
    }
    res.json({ message: 'Callback request submitted successfully.' });
  });
});
app.get('/fetchservice', (req, res) => {
  const query = 'SELECT id, serviceDate, serviceItem,serviceType, serviceLocation, assignedPersonName, status FROM services';
  pool.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({ message: 'Error fetching services' });
    } else {
      res.status(200).json(results);
    }
  });
});
app.delete('/cart/:id', (req, res) => {
  const itemId = req.params.id;

  const deleteQuery = 'DELETE FROM cart WHERE id = ?';

  pool.query(deleteQuery, [itemId], (err, result) => {
    if (err) {
      console.error('Error deleting item from cart:', err);
      res.status(500).json({ success: false, message: 'Failed to remove item from cart.' });
      return;
    }

    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Item removed from cart.' });
    } else {
      res.status(404).json({ success: false, message: 'Item not found in cart.' });
    }
  });
});
app.post('/orders', (req, res) => {
  const { crn, address, paymentMethod, items,deliveryDate } = req.body;

  // Prepare the SQL query for inserting each item as a separate record in the orders table
  const orderQuery = `
    INSERT INTO orders (crn, address, paymentMethod, productId, productQuantity, productPrice,deliveryDate) 
    VALUES (?, ?, ?, ?, ?, ?,?)
  `;
  
  const orderPromises = items.map(item => {
    return new Promise((resolve, reject) => {
      pool.query(
        orderQuery, 
        [crn, JSON.stringify(address), paymentMethod, item.productId, item.productQuantity, item.productPrice,deliveryDate],
        (err, result) => {
          if (err) {
            console.error('Error inserting order:', err);
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });
  });

  Promise.all(orderPromises)
    .then(() => res.status(201).json({ message: 'Order inserted successfully' }))
    .catch(err => res.status(500).json({ error: 'Order insertion failed' }));
});

app.get('/orders', (req, res) => {
  const { crn } = req.query;
console.log(crn)
  if (!crn) {
    return res.status(400).json({ error: 'CRN is required' });
  }

  const query = `
    SELECT 
      o.orderId, o.crn, o.address, o.paymentMethod, o.productId, 
      o.productQuantity, o.productPrice, o.orderDate,
      p.productName, p.productCategory, p.productDescription, 
      p.productSizes, p.productImageUrl1
    FROM orders o
    JOIN products p ON o.productId = p.productId
    WHERE o.crn = ?
    ORDER BY o.orderDate DESC
  `;

  pool.query(query, [crn], (err, results) => {
    if (err) {
      console.error('Error fetching orders:', err);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }

    // Group orders by orderId
    const orders = results.reduce((acc, row) => {
      const {
        orderId, crn, address, paymentMethod, productId,
        productQuantity, productPrice, orderDate, productName,
        productCategory, productDescription, productSizes,
        productImageUrl1
      } = row;

      if (!acc[orderId]) {
        acc[orderId] = {
          orderId,
          crn,
          address: JSON.parse(address),
          paymentMethod,
          orderDate,
          items: []
        };
      }

      acc[orderId].items.push({
        productId,
        productQuantity,
        productPrice,
        productName,
        productCategory,
        productDescription,
        productSizes,
    
          productImageUrl1
        
      });
console.log(row)
      return acc;
    }, {});

    res.json(Object.values(orders));
  });
});
app.delete('/cart/remove', (req, res) => {
  console.log('Delete endpoint hit');
  console.log('Request Body:', req.body);

  const { crn, productId } = req.body;
  if (!crn || !productId) {
    return res.status(400).json({ message: 'Missing crn or productId', success: false });
  }

  const query = 'DELETE FROM cart WHERE crn = ? AND productId = ?';
  pool.query(query, [crn, productId], (err, results) => {
    if (err) {
      console.error('Error removing product from cart:', err);
      return res.status(500).json({ message: 'Error removing product from cart', success: false });
    }

    console.log('Affected Rows:', results.affectedRows);
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Item not found in cart.', success: false });
    }

    res.status(200).json({ message: 'Item removed successfully.', success: true });
  });
});

app.put('/products/updateQuantity', (req, res) => {
  const { crn, productId, productQuantity } = req.body;

  const deleteQuery = 'DELETE FROM cart WHERE crn = ? AND productId = ?';
  const updateQuery = 'UPDATE products SET productQuantity = productQuantity - ? WHERE productId = ?';

  pool.getConnection((err, connection) => {
      if (err) {
          console.error('Error getting connection:', err);
          return res.status(500).send('Database connection error');
      }

      connection.beginTransaction((err) => {
          if (err) {
              console.error('Error starting transaction:', err);
              return res.status(500).send('Transaction error');
          }

          // Delete item from cart
          connection.query(deleteQuery, [crn, productId], (err, deleteResults) => {
              if (err) {
                  return connection.rollback(() => {
                      console.error('Error deleting product from cart:', err);
                      res.status(500).send('Error deleting product from cart');
                  });
              }

              // If no rows were deleted, the item was not in the cart
              if (deleteResults.affectedRows === 0) {
                  return connection.rollback(() => {
                      console.error('Item not found in cart.');
                      res.status(404).json({ message: 'Item not found in cart.', success: false });
                  });
              }

              // Update product quantity
              connection.query(updateQuery, [productQuantity, productId], (err) => {
                  if (err) {
                      return connection.rollback(() => {
                          console.error('Error updating product quantity:', err);
                          res.status(500).send('Error updating product quantity');
                      });
                  }

                  connection.commit((err) => {
                      if (err) {
                          return connection.rollback(() => {
                              console.error('Error committing transaction:', err);
                              res.status(500).send('Transaction commit error');
                          });
                      }

                      console.log('Product removed from cart and quantity updated successfully.');
                      res.status(200).json({ message: 'Product removed from cart and quantity updated.', success: true });
                  });
              });
          });
      });

      connection.release();
  });
});
app.get('/ordersall', (req, res) => {
  const query = 'SELECT * FROM orders';
  pool.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching orders:', err);
      return res.status(500).send('Error fetching orders');
    }
    res.json(results);
  });
});

// Endpoint to fetch all records from the products table
app.get('/productsall', (req, res) => {
  const query = 'SELECT * FROM products';
  pool.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching products:', err);
      return res.status(500).send('Error fetching products');
    }
    res.json(results);
  });
});

// Endpoint to fetch all records from the services table
app.get('/servicesall', (req, res) => {
  const query = 'SELECT * FROM services';
  pool.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      return res.status(500).send('Error fetching services');
    }
    res.json(results);
  });
});
app.listen(port,()=>{
    console.log(`this is running on this port :${port} `)
})
