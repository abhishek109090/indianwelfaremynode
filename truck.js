const { response } = require('express')
const session = require('express-session');
const express = require('express')

const app = express();
const fs = require('fs');
const {v4: uuidv4} = require('uuid');
const AWS = require('aws-sdk');
const {S3Client, PutObjectCommand, BucketType} = require('@aws-sdk/client-s3')
const dotenv = require('dotenv');
dotenv.config();
// Initialize express-session to manage sessions
app.use(session({ secret: 'your-secret-key', resave: false, saveUninitialized: false }));

// const Pool = require('pg').Pool
// const pool = new Pool({
//     host: 'localhost',
//     port: 5432,
//     database: 'login',
//     user: 'postgres',
//     password: 'Abhi@2001',
// })
AWS.config.update({
  accessKeyId:  process.env.ACCESS_KEY,
  secretAccessKey:  process.env.SECRET_ACCESS_KEY,
  region:  process.env.BUCKET_REGION,
});
console.log(AWS.config.update)
const s4 = new AWS.S3();

const bucketname = process.env.BUCKET_NAME;
const bucketRegion =  process.env.BUCKET_REGION;
const accessKey =  process.env.ACCESS_KEY;
const secretAccessKey =  process.env.SECRET_ACCESS_KEY;
console.log(bucketname,bucketRegion,accessKey)
const s3 = new S3Client({ 
  region: bucketRegion,
  credentials: ({
    accessKeyId: accessKey,    
    secretAccessKey: secretAccessKey,  
  }),
});
const mysql = require('mysql');

// const connection = mysql.createConnection({
//   host: '68.178.149.116', 
//   port:'3306',
//   user: 'truckbooking',
//   password: 'truckbooking',
//   database: 'truckbooking',
//   connectTimeout: 30000,
 
// });                            
 
// connection.connect((err,connection) => {
//   if (err) {
//     console.error('Error connecting to MySQL:', err.stack);
//     return;
//   } 

//   console.log('Connected to MySQL as ID:', connection.threadId);

//   // Release the connection when done

// });  
// connection.on('error', (err) => {
//   if (err.code === 'PROTOCOL_CONNECTION_LOST') {
//     console.error('Database connection was closed.');
//   } else if (err.code === 'ER_CON_COUNT_ERROR') {
//     console.error('Database has too many connections.');
//   } else if (err.code === 'ECONNRESET') {
//     console.error('Connection to database was reset.');
//   } else { 
//     console.error('Unexpected database error:', err.message);
//   }
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
// Middleware to ensure the user is authenticated and retrieve the CRN from the session
app.use((req, res, next) => {
    if (req.session && req.session.crn) {
        res.locals.crn = req.session.crn; // Make CRN available to routes
    }
    next();
});


const getTruckNumber = (request, response) => {
    const { crn } = request.query;
    console.log(`Fetching data for date range: ${crn}`);
  
    pool.query('SELECT truckNumber, status, truckstatus FROM truck WHERE crn = ?', [crn], (error, results) => {
      if (error) {
        throw error;
      }
      response.status(200).json(results);
      console.log(results);
    });
  };
  const getTruckStatus = (request, response) => {
    const {truckNumber } = request.params;
    console.log(`Fetching data for date range: ${truckNumber}`);
  
    pool.query('SELECT  status FROM truck WHERE truckNumber = ?', [truckNumber], (error, results) => {
      if (error) {
        throw error;
      }
      response.status(200).json(results);
      console.log(results); 
    });   
  };  
  
    
const getTruckNumber2 = (request, response) => {
    const { crn } = request.query;
    console.log('crn', crn)
    pool.query('select truckNumber from truck WHERE crn = ?', [crn], (error, results) => {
        if (error) {
            throw error
        }
        const truckNumbers = results.map((row) => row.truckNumber);
        console.log(truckNumbers)
        response.json(truckNumbers);
    })
}
const getTruckNumber1 = (request, response) => {
    const { crn } = request.query;

    pool.query(
        'select * from booking WHERE crn = ?',
        [crn],
        (error, results) => {
            if (error) {
                throw error;
            }

            const truckData = results.map((row) => ({
                truckNumber: row.truckNumber,
                truckName: row.truckName,
                date: row.date,
                from: row.from,
                to: row.to,
                status: row.status || "No Booking",
            }));
            response.json(truckData); 
        }
    );
}
const getTruck = (request, response) => {
  const {crn}= request.params;
  console.log('crn',crn)
  pool.query('select * from truck where crn = ? ',[crn],async (error, results) => {
      if (error) {
        throw error;
      }

      const trucksWithImageURLs = await Promise.all(
        results.map(async (truck) => { 
          // Function to get the S3 URL for an image
          const getImageUrl = async (imageName) => {
            const params = {
              Bucket: bucketname,
              Key: imageName,
            };

            const signedUrl = await s4.getSignedUrlPromise('getObject', params);
            return signedUrl;
          };     

          const uploadRegistrationUrl = await getImageUrl(truck.uploadRegistration);
          const truckFrontSideWithNumberPlateUrl = await getImageUrl(truck.truckFrontSideWithNumberPlate);
          const truckBackSideWithNumberPlateUrl = await getImageUrl(truck.truckBackSideWithNumberPlate);
          const truckCabinUrl = await getImageUrl(truck.truckCabin);
          const truckOdometerUrl = await getImageUrl(truck.truckOdometer);
          const truckVideoUrl = await getImageUrl(truck.truckVideo);
          const truckPermitUrl = await getImageUrl(truck.truckPermit);
          const truckFitUrl = await getImageUrl(truck.truckFit);
          const truckPollutionCertificateUrl = await getImageUrl(truck.truckPollutionCertificate);
          const truckInsuranceCertificateUrl = await getImageUrl(truck.truckInsuranceCertificate);
          const truckOwnerPassportSizePhotoUrl = await getImageUrl(truck.truckOwnerPassportSizePhoto);
          const rightsideUrl = await getImageUrl(truck.rightside);
          const leftsideUrl = await getImageUrl(truck.leftside);
  
          return {   
            ...truck,    
            uploadRegistrationUrl,  
            truckFrontSideWithNumberPlateUrl,
            truckBackSideWithNumberPlateUrl,
            truckCabinUrl,
            truckOdometerUrl,
            truckVideoUrl,
            truckPermitUrl,
            truckFitUrl,
            truckPollutionCertificateUrl,
            truckInsuranceCertificateUrl,
            truckOwnerPassportSizePhotoUrl,
            rightsideUrl,
            leftsideUrl,
          };
        })
      );
      response.status(200).json(trucksWithImageURLs);
    }
  );
};
    const getTruckverification = (request, response) => {
      const { feildcrn } = request.query;
      console.log(feildcrn);
    
      pool.query(
        'SELECT t1.*, t2.ownername, t2.owneremail FROM truck AS t1 JOIN owner1 AS t2 ON t1.crn = t2.crn WHERE t1.feildcrn = ?',
        [feildcrn],
        async (error, results) => {
          if (error) {
            throw error;
          }
      
          const trucksWithImageURLs = await Promise.all(
            results.map(async (truck) => {
              // Function to get the S3 URL for an image
              const getImageUrl = async (imageName) => {
                const params = {
                  Bucket: bucketname,
                  Key: imageName,
                };
    
                const signedUrl = await s4.getSignedUrlPromise('getObject', params);
                return signedUrl;
              };
    
              const uploadRegistrationUrl = await getImageUrl(truck.uploadRegistration);
              const truckFrontSideWithNumberPlateUrl = await getImageUrl(truck.truckFrontSideWithNumberPlate);
              const truckBackSideWithNumberPlateUrl = await getImageUrl(truck.truckBackSideWithNumberPlate);
              const truckCabinUrl = await getImageUrl(truck.truckCabin);
              const truckOdometerUrl = await getImageUrl(truck.truckOdometer);
              const truckVideoUrl = await getImageUrl(truck.truckVideo);
              const truckPermitUrl = await getImageUrl(truck.truckPermit);
              const truckFitUrl = await getImageUrl(truck.truckFit);
              const truckPollutionCertificateUrl = await getImageUrl(truck.truckPollutionCertificate);
              const truckInsuranceCertificateUrl = await getImageUrl(truck.truckInsuranceCertificate);
              const truckOwnerPassportSizePhotoUrl = await getImageUrl(truck.truckOwnerPassportSizePhoto);
              const rightsideUrl = await getImageUrl(truck.rightside);
              const leftsideUrl = await getImageUrl(truck.leftside);
    
              return {
                ...truck,
                uploadRegistrationUrl,
                truckFrontSideWithNumberPlateUrl,
                truckBackSideWithNumberPlateUrl,
                truckCabinUrl,
                truckOdometerUrl,
                truckVideoUrl,
                truckPermitUrl,
                truckFitUrl,
                truckPollutionCertificateUrl,
                truckInsuranceCertificateUrl,
                truckOwnerPassportSizePhotoUrl,
                rightsideUrl,
                leftsideUrl,
              };
            })
          );
    
          response.status(200).json(trucksWithImageURLs);
        }
      );
    };
    
const getSubLocations = (request, response) => {  
    pool.query('select * from sub ', (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}
const getSub = (request, response) => {
    const { loadingSublocations, unloadingSublocations } = request.query;
    pool.query(' SELECT distance FROM sub WHERE loadingSublocations = ?  AND unloadingSublocations = ? ', [loadingSublocations, unloadingSublocations], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results)  
    })
}
const getSubLocationsById = (request, respose) => {  
    const id = parseInt(request.params.id)
    pool.query('select * from sub where id=?', [id], (error, results) => {
        if (error) { 
            throw error
        }
        respose.status(200).json(results)
    })
}
const getVerified = (request, response) => {
    const { feildcrn, status } = request.query;
    console.log('ff',feildcrn,'ss',status)
    if (status === 'Completed') {
        pool.query('SELECT * FROM truck WHERE status = ? and feildcrn = ?', [status, feildcrn], (error, results) => {
            if (error) {
                console.error('Error fetching verified trucks:', error);
                response.status(500).json({ error: 'An error occurred while fetching data' });
            } else {
                response.status(200).json(results);
            }
        });
    } else {   
        // Handle other status conditions or return an empty array
        response.status(200).json([]);
    }   
}
     
const createSublocations = (request, response) => {    
    const {  
        loadingSublocations,  
        unloadingSublocations,
        distance,
    } = request.body
    pool.query('insert into sub (loadingSublocations ,unloadingSublocations,distance) values(?,?,?)', [loadingSublocations, unloadingSublocations, distance], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).send(`sublocations add with id:${results.insertid}`)
    })
}
const deleteSubLocations = (request, response) => {
    const id = parseInt(request.params.id)
    pool.query('DELETE FROM sublocations  WHERE id=?', [id], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).send(` deleted  sublocation with id:${id}`)
    })
}    
const getTruckById = (request, respose) => {
    const id = parseInt(request.params.id)
    pool.query('select * from truck where id= ?', [id], (error, results) => {
        if (error) {
            throw error
        }
        respose.status(200).json(results.rows)
    })
}
const createTruck = async (request, response) => {
    try {
      const {
        truckNumber,
        truckMaxWeight,
        truckWheels,
        truckPermitValidity,
        truckFitValidity,
        truckPollutionCertificateValidity,
        truckInsuranceCertificateValidity,
        name,
        reqdate,
        crn,
        feildcrn
      } = request.body;
  
      const {
        uploadRegistration,
        truckFrontSideWithNumberPlate,
        truckBackSideWithNumberPlate,
        rightside,
        leftside,
        truckCabin, // Cabin image
        truckOdometer, // Odometer image
        truckVideo, // Video file
        truckPermit,
        truckFit,
        truckPollutionCertificate,
        truckInsuranceCertificate,
        truckOwnerPassportSizePhoto,
      } = request.files;
  
      const filenames = {
        uploadRegistration: `registration_${uuidv4()}.jpg`,
        truckFrontSideWithNumberPlate: `front_${uuidv4()}.jpg`,
        truckBackSideWithNumberPlate: `back_${uuidv4()}.jpg`, 
        truckCabin: `cabin_${uuidv4()}.jpg`,
        truckOdometer: `odometer_${uuidv4()}.jpg`,
        truckVideo: `video_${uuidv4()}.mp4`,  
        truckPermit: `permit_${uuidv4()}.jpg`,
        truckFit: `fit_${uuidv4()}.jpg`,
        rightside: `rightside_${uuidv4()}.jpg`,
        leftside: `leftside_${uuidv4()}.jpg`,
        truckPollutionCertificate: `pollution_${uuidv4()}.jpg`,
        truckInsuranceCertificate: `insurance_${uuidv4()}.jpg`,
        truckOwnerPassportSizePhoto: `passport_${uuidv4()}.jpg`,
      };
  
      // Upload files to AWS S3
      await Promise.all([
        uploadFileToS3(uploadRegistration[0], filenames.uploadRegistration),
        uploadFileToS3(truckFrontSideWithNumberPlate[0], filenames.truckFrontSideWithNumberPlate),
        uploadFileToS3(truckBackSideWithNumberPlate[0], filenames.truckBackSideWithNumberPlate),
        uploadFileToS3(rightside[0], filenames.rightside),
        uploadFileToS3(leftside[0], filenames.leftside),
        uploadFileToS3(truckCabin[0], filenames.truckCabin),
        uploadFileToS3(truckOdometer[0], filenames.truckOdometer),
        uploadFileToS3(truckVideo[0], filenames.truckVideo),
        uploadFileToS3(truckPermit[0], filenames.truckPermit),
        uploadFileToS3(truckFit[0], filenames.truckFit),
        uploadFileToS3(truckPollutionCertificate[0], filenames.truckPollutionCertificate),
        uploadFileToS3(truckInsuranceCertificate[0], filenames.truckInsuranceCertificate),
        uploadFileToS3(truckOwnerPassportSizePhoto[0], filenames.truckOwnerPassportSizePhoto),
      ]);
          
      // Insert data into the MySQL database  
      const results = await insertTruckDataIntoDB({   
        truckNumber,
        filenames,
        truckMaxWeight,
        truckWheels,
        truckPermitValidity,
        truckFitValidity,
        truckPollutionCertificateValidity,
        truckInsuranceCertificateValidity,
        name,
        reqdate,
        crn,
        feildcrn
      });
  
      response.status(200).send(`Truck added with ID: ${results.insertId}`);
    } catch (error) {
      console.error(error);
      response.status(500).send("Internal Server Error");
    }
  };
  
  // Function to insert truck data into the MySQL database
  const insertTruckDataIntoDB = async ({
    truckNumber,
    filenames,
    truckMaxWeight,
    truckWheels,
    truckPermitValidity,
    truckFitValidity,
    truckPollutionCertificateValidity,
    truckInsuranceCertificateValidity,
    name,
    reqdate,
    crn,
    feildcrn
  }) => {
    return new Promise((resolve, reject) => {
      pool.query(
        'insert into truck (truckNumber, uploadRegistration, truckMaxWeight, truckWheels, truckFrontSideWithNumberPlate, truckBackSideWithNumberPlate, truckCabin, truckOdometer, truckVideo, truckPermit, truckFit, truckPollutionCertificate, truckInsuranceCertificate, truckOwnerPassportSizePhoto, truckPermitValidity, truckFitValidity, truckPollutionCertificateValidity, truckInsuranceCertificateValidity, crn, name, reqdate, rightside, leftside, feildcrn) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [
          truckNumber,
          filenames.uploadRegistration,
          truckMaxWeight,
          truckWheels,
          filenames.truckFrontSideWithNumberPlate,
          filenames.truckBackSideWithNumberPlate,
          filenames.truckCabin,
          filenames.truckOdometer,
          filenames.truckVideo,
          filenames.truckPermit,
          filenames.truckFit,
          filenames.truckPollutionCertificate,
          filenames.truckInsuranceCertificate,
          filenames.truckOwnerPassportSizePhoto,
          truckPermitValidity,
          truckFitValidity,
          truckPollutionCertificateValidity,
          truckInsuranceCertificateValidity,
          crn,
          name,
          reqdate,
          filenames.rightside,
          filenames.leftside,
          feildcrn
        ],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        }
      );
    });
  };
  
  // Function to upload a file to AWS S3
  const uploadFileToS3 = async (file, filename) => {
    const params = {
      Bucket: bucketname,
      Key: filename,
      Body: fs.createReadStream(file.path),
      ContentType: file.mimetype,
    };
  
    try {
      const command = new PutObjectCommand(params);
      await s3.send(command);
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw error;
    }
  };

const getBook = (request, response) => {
    pool.query('select * from booking ', (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results)
    })
}
const getDriver = (request, response) => {
    const { crn } = request.query;
    console.log(crn)
    pool.query('select * from driver where  crn=? ', [crn], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results)
    })
}
const getTbr = (request, response) => {
    const { crn, tbr } = request.query;
    console.log(crn)
    pool.query('select * from booking where  crn=? and tbr=? ', [crn,tbr], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results)
    })
}
const getBookById = (request, respose) => {
    const id = parseInt(request.params.id)
    pool.query('select * from booking where id=?', [id], (error, results) => {
        if (error) {
            throw error
        }
        respose.status(200).json(results)
    })
}
const createDriver = async (request, response) => {
    try {
      const {
        driverName,
        phoneNumber,
        email,
        licenseIssuedDate,
        licenseValidityDate,
        dateOfJoining,
        crn,
      } = request.body;
  console.log(request.body)
      const {
        licenseFront,
        licenseBack,
        aadharFront,
        aadharBack,
        policeVerificationCertificate,
        healthCertificate,
        driverPhoto,
      } = request.files;
  console.log(request.files)
      const filenames = {
        licenseFront: `license_front_${uuidv4()}.jpg`,
        licenseBack: `license_back_${uuidv4()}.jpg`,  
        aadharFront: `aadhar_front_${uuidv4()}.jpg`,
        aadharBack: `aadhar_back_${uuidv4()}.jpg`,
        policeVerificationCertificate: `police_verification_${uuidv4()}.jpg`,
        healthCertificate: `health_certificate_${uuidv4()}.jpg`,
        driverPhoto: `driver_photo_${uuidv4()}.jpg`,
      };
  
      // Upload files to AWS S3
      await Promise.all([
        uploadFileToS(licenseFront[0], filenames.licenseFront),
        uploadFileToS(licenseBack[0], filenames.licenseBack),
        uploadFileToS(aadharFront[0], filenames.aadharFront),
        uploadFileToS(aadharBack[0], filenames.aadharBack),
        uploadFileToS(policeVerificationCertificate[0], filenames.policeVerificationCertificate),
        uploadFileToS(healthCertificate[0], filenames.healthCertificate),
        uploadFileToS(driverPhoto[0], filenames.driverPhoto),
      ]);
  
      // Insert data into the MySQL database
      const results = await insertDriverDataIntoDB({
        driverName,
        phoneNumber,
        email,
        licenseIssuedDate,
        licenseValidityDate,    
        dateOfJoining,  
        crn,
        filenames,
      });
  
      response.status(200).send(`Driver added with ID: ${results.insertId}`);
    } catch (error) {
      console.error(error);
      response.status(500).send("Internal Server Error");
    }
  };
  
  // Function to insert driver data into the MySQL database
  const insertDriverDataIntoDB = async ({
    driverName,
    phoneNumber,
    email,
    licenseIssuedDate,
    licenseValidityDate,
    dateOfJoining,
    crn,
    filenames,
  }) => {
    return new Promise((resolve, reject) => {
      pool.query(
        'insert into driver (driverName,phoneNumber, email, licenseFront, licenseBack, licenseIssuedDate,licenseValidityDate,aadharFront, aadharBack, policeVerificationCertificate, healthCertificate,driverPhoto, dateOfJoining,crn) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [
          driverName,
          phoneNumber,
          email,
          filenames.licenseFront,
          filenames.licenseBack,
          licenseIssuedDate,
          licenseValidityDate,
          filenames.aadharFront,
          filenames.aadharBack,
          filenames.policeVerificationCertificate,
          filenames.healthCertificate,
          filenames.driverPhoto,
          dateOfJoining,
          crn,
        ],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        }
      );
    });
  };
  
  // Function to upload a file to AWS S3
  const uploadFileToS = async (file, filename) => {
    const params = {
      Bucket: bucketname,  
      Key: filename,  
      Body: fs.createReadStream(file.path),
      ContentType: file.mimetype,        
    };
  
    try {    
      const command = new PutObjectCommand(params);   
      await s3.send(command);
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw error;
    }
  };
const createDriving = (request, response) => {
    const {
        name,
        phonenumber,
     tbr,
     localDate,
        crn,
    } = request.body
    pool.query('insert into driving (name, phonenumber, tbr, localDate, crn) values(?,?,?,?,?)', [name,phonenumber, tbr, localDate, crn], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).send(`truck add with id:${results.insertid}`)
    })
}
const createBook = (request, response) => {  
    const now = new Date();
  const localDate = now.getDate().toString().padStart(2, '0');
  const localMonth = (now.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
  const localYear = now.getFullYear().toString();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  let serialNumber = 1;

function generateSerialNumber() {
  const paddedSerialNumber = serialNumber.toString().padStart(3, '0');
  serialNumber++;
  return paddedSerialNumber;
}

// Usage:
const uniqueSerialNumber = generateSerialNumber();

  // Create the TBR number
  const tbr = `TBR${localDate}${localMonth}${localYear}${hours}${minutes}${uniqueSerialNumber}`;
    const {
        truckNumber, 
        truckWheels,   
        fromSublocation,
        toSublocation,
        crn,   
        date,
        from,
        time,
        to,
        fromPincode,
        toPincode,
        totalkilometers,
        totalPrice,      
        name,   
        phonenumber,   
        fromAddress,
        toAddress,
        truckMaxWeight,         
        loadweight,
        type,      
        agentId,                      
        Modeofpayment,         
        InvoiceNumber,
        PaymentDate,
        PaymentTime,
        paymentStatus,
        bookeddate,
        truckPostingID
    } = request.body  
    pool.query('insert into booking ( truckNumber, truckWheels, fromSublocation, toSublocation, crn, date,  `from`, time, `to`, fromPincode, toPincode, totalkilometers, totalPrice, name, fromAddress, toAddress,truckMaxWeight,phonenumber,loadweight,type,tbr,agentId,Modeofpayment,InvoiceNumber,PaymentDate,PaymentTime,paymentStatus,bookeddate,truckPostingID) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [truckNumber, truckWheels, fromSublocation, toSublocation, crn, date, from, time, to, fromPincode, toPincode, totalkilometers, totalPrice, name, fromAddress, toAddress, truckMaxWeight, phonenumber,loadweight, type,tbr,agentId,Modeofpayment,InvoiceNumber,PaymentDate,PaymentTime,paymentStatus,bookeddate,truckPostingID], (error, results) => {
        if (error) {  
            throw error  
        }
    
const bookingstatustrack = 'booked';
        // Update the bookingstatustrack to "Booked"
        pool.query('UPDATE post SET bookingstatustrack = ? WHERE truckNumber = ? AND date = ? AND time = ?',
        [bookingstatustrack, truckNumber, date, time],
        (updateError, updateResults) => {
          console.log('status updated',updateResults,bookingstatustrack)
            if (updateError) {
              throw updateError;
            }
  
        response.status(200).send(`truck add with id:${results.insertid}`)
    }) }  
    )
}    
const delTruck = (request, response) => {
    const truckNumber = request.params.truckNumber;
    pool.query('DELETE FROM post1  WHERE truckNumber=?', [truckNumber], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).send(` deleted  truck with trucknumber:${truckNumber}`)
    })
} 
const updateTruck = (request, response) => {
    const id = parseInt(request.params.id)
    const {
        truckNumber,
        uploadRegistration,
        truckMaxWeight,
        truckWheels,
        truckFrontSideWithNumberPlate,
        truckBackSideWithNumberPlate,
        truckCabin,
        truckOdometer,
        truckVideo,
        truckPermit,
        truckFit,
        truckPollutionCertificate,
        truckInsuranceCertificate,
        truckOwnerPassportSizePhoto,
        truckDriverLicenseFrontSide,
        truckDriverLicenseBackSide,
        TruckDriverPoliceVerificationCertificate,
        crn,
    } = request.body
    pool.query('update truck set "truckNumber"=$2, "uploadRegistration"=$3, "truckMaxWeight"=$4, "truckWheels"=$5, "truckFrontSideWithNumberPlate"=$6, "truckBackSideWithNumberPlate"=$7, "truckCabin"=$8, "truckOdometer"=$9, "truckVideo"=$10, "truckPermit"=$11, "truckFit"=$12, "truckPollutionCertificate"=$13, "truckInsuranceCertificate"=$14, "truckOwnerPassportSizePhoto"=$15, "truckDriverLicenseFrontSide"=$16, "truckDriverLicenseBackSide"=$17, "TruckDriverPoliceVerificationCertificate"=$18, crn=$19 where id=$1', [truckNumber, uploadRegistration, truckMaxWeight, truckWheels, truckFrontSideWithNumberPlate, truckBackSideWithNumberPlate, truckCabin, truckOdometer, truckVideo, truckPermit, truckFit, truckPollutionCertificate, truckInsuranceCertificate, truckOwnerPassportSizePhoto, truckDriverLicenseFrontSide, truckDriverLicenseBackSide, TruckDriverPoliceVerificationCertificate, crn], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).send(`truck updated with id:${id}`)
    })
}
const updateTruckStatus = (request, response) => {
    const id = parseInt(request.params.id);
    const { status,verificationDate } = request.body;
    pool.query('UPDATE truck SET status = ?, verificationDate = ? WHERE id = ?', [status,verificationDate, id], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).send(`Truck status updated with ID: ${id}`);
    });
};   
const updateLoadingStatus = (request, response) => {  
    const id = parseInt(request.params.id);
    const { loadingstatus,Truckduty } = request.body;
    pool.query('UPDATE booking SET loadingstatus = ?,Truckduty = ? WHERE id = ?', [loadingstatus,Truckduty, id], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).send(`Truck status updated with ID: ${id}`);
    });   
}; 
const updatePaymentstatus = (request, response) => {  
  const tbr = request.params.tbr;
    const crn = request.params.crn;
  const { Modeofpayment, InvoiceNumber,PaymentDate,PaymentTime,paymentStatus} = request.body;
  pool.query('UPDATE booking SET Modeofpayment = ?,InvoiceNumber = ?,PaymentDate = ?,PaymentTime = ?,paymentStatus = ? WHERE tbr = ? and crn = ?', [Modeofpayment, InvoiceNumber,PaymentDate,PaymentTime,paymentStatus,tbr,crn], (error, results) => {
      if (error) {
          throw error;
      }
      response.status(200).send(`Truck status updated with ID: ${tbr}`);
  });     
}; 
const updateunloadingStatus = (request, response) => {
    const id = parseInt(request.params.id);
    const { unloadingstatus ,Truckduty} = request.body;
    pool.query('UPDATE booking SET unloadingstatus = ? , Truckduty = ? WHERE id = ?', [unloadingstatus,Truckduty, id], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).send(`Truck status updated with ID: ${id}`);
    }); 
};
const updatetruckStatus = (request, response) => {
    const { truckNumber, truckstatus } = request.body;
    console.log('Updating truck status for:', truckNumber);
    console.log('New status:', truckstatus);

    pool.query('UPDATE truck SET truckstatus = ? WHERE truckNumber = ?', [truckstatus, truckNumber], (error, results) => {
        if (error) {
            console.error('Error updating truck status:', error);
            response.status(500).send('Error updating truck status');
        } else {
            console.log('Truck status updated successfully');
            response.status(200).send(`Truck status updated with ID: ${truckNumber}`);
        }
    });   
};  

const updateDriverStatus = (request, response) => {
    

    const { tbr,driverphonenumber,driverName, driverstatus} = request.body;
    console.log('Received data:', tbr, driverphonenumber, driverName, driverstatus);
    pool.query('UPDATE booking SET driverphonenumber = ?,driverName=?, driverstatus=? WHERE tbr = ?', [driverphonenumber,driverName, driverstatus,tbr], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).send(`Truck status updated with ID: `);
    }); 
}; 
const updateDriverStatus1 = (request, response) => {
    const id = parseInt(request.params.id);
    const { status } = request.body;
    pool.query('UPDATE driver SET status = ? WHERE id = ?', [status, id], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).send(`Truck status updated with ID: ${id}`);
    }); 
}; 
const deleteTruck = (request, response) => {
    const id = parseInt(request.params.id)
    pool.query('DELETE FROM truck  WHERE id=?', [id], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).send(` deleted  truck with id:${id}`)
    })
}
// const deleteBooking=(request,response)=>{
//     const id=parseInt(request.params.id)
//     pool.query('DELETE FROM booking  WHERE id=$1',[id],(error,results)=>
//     {
//         if(error){  
//             throw error
//         }
//         response.status(200).send(` deleted  truck with id:${id}`)
//     })
// }
const getBooking = (request, response) => {

    pool.query('SELECT * FROM booking ', (error, results) => {
        if (error) {
            console.error('Error fetching data:', error);
            response.status(500).json({ error: 'Internal Server Error' });
            return;
        }   
        response.status(200).json(results);     
         
    });           
};  
const getinvoice = (request, response) => {
  const { invoiceNumber, crn } = request.query;
    pool.query('SELECT * FROM booking WHERE InvoiceNumber = ? AND crn = ?', [invoiceNumber, crn], (error, results) => {
      if (error) {
        response.status(500).json({ message: 'Internal server error' });
      } else {
        if (results.length === 0) {
          response.status(404).json({ message: 'No data found' });
        } else {
          response.status(200).json(results[0]);
          console.log(results)
        }}
  });           
};  

const getBooking1 = (request, response) => {
    const { crn } = request.query;
    const {phonenumber} =request.query;
    pool.query(`select * from booking WHERE crn = ? and phonenumber=? `, [crn,phonenumber], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json(results)
      
    })
}
const getmobiletruck = (request, response) => {
 
  pool.query(`SELECT * FROM post JOIN truck ON post.truckNumber = truck.truckNumber `, async(error, results) => {
      if (error) {
        throw error;
      }

      const trucksWithImageURLs = await Promise.all(
        results.map(async (truck) => {
          // Function to get the S3 URL for an image
          const getImageUrl = async (imageName) => {       
            const params = {  
              Bucket: bucketname,  
              Key: imageName,
            };

            const signedUrl = await s4.getSignedUrlPromise('getObject', params);
            return signedUrl;
          };

          const uploadRegistrationUrl = await getImageUrl(truck.uploadRegistration);
          const truckFrontSideWithNumberPlateUrl = await getImageUrl(truck.truckFrontSideWithNumberPlate);
          const truckBackSideWithNumberPlateUrl = await getImageUrl(truck.truckBackSideWithNumberPlate);
          const truckCabinUrl = await getImageUrl(truck.truckCabin);
          const truckOdometerUrl = await getImageUrl(truck.truckOdometer);
          const truckVideoUrl = await getImageUrl(truck.truckVideo);
          const truckPermitUrl = await getImageUrl(truck.truckPermit);
          const truckFitUrl = await getImageUrl(truck.truckFit);
          const truckPollutionCertificateUrl = await getImageUrl(truck.truckPollutionCertificate);
          const truckInsuranceCertificateUrl = await getImageUrl(truck.truckInsuranceCertificate);
          const truckOwnerPassportSizePhotoUrl = await getImageUrl(truck.truckOwnerPassportSizePhoto);
          const rightsideUrl = await getImageUrl(truck.rightside);
          const leftsideUrl = await getImageUrl(truck.leftside);

          return {
            ...truck,
            uploadRegistrationUrl,
            truckFrontSideWithNumberPlateUrl,
            truckBackSideWithNumberPlateUrl,
            truckCabinUrl,
            truckOdometerUrl,
            truckVideoUrl,
            truckPermitUrl,  
            truckFitUrl,
            truckPollutionCertificateUrl,
            truckInsuranceCertificateUrl,
            truckOwnerPassportSizePhotoUrl,
            rightsideUrl,
            leftsideUrl,
          };
        })
      );

      response.status(200).json(trucksWithImageURLs);
    }
  );
};
const getSearchTbr = (request, response) => {  
  const { crn,tbr } = request.query;
  console.log(crn,tbr)
  pool.query(`select loadingStatus,crn,tbr from booking WHERE crn = ? and tbr=? `, [crn,tbr], (error, results) => {
      if (error) {  
          throw error;
      }   
      response.status(200).json(results)
      
  })  
}
const Updatedriverstatus = (req, res) => {
  const { driverId } = req.params;

  // Extract the new status from the request body
  const { status } = req.body;

  // Perform a MySQL query to update the driver's status
  pool.query('UPDATE driver SET status = ? WHERE id = ?', [status, driverId], (error, results) => {
    if (error) {
      console.error('Error updating driver status:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      // Send a success response
      res.status(200).json({ message: 'Driver status updated successfully.' });
    }
  });
}
const getPaymentUpdate = (req, res) => {
    const bookingId = parseInt(req.params.id);
    if (isNaN(bookingId)) {
        return res.status(400).json({ message: 'Invalid booking ID' });
    }

    const updatePaymentStatusQuery = `
      UPDATE public.booking
      SET "paymentStatus" = 'payment completed'
      WHERE id = $1;
    `;

    pool.query(updatePaymentStatusQuery, [bookingId], (error, result) => {
        if (error) {
            console.error('Error updating payment status:', error);
            return res.status(500).json({ message: 'Error updating payment status' });
        }

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        return res.status(200).json({ message: 'Payment status updated to Payment Completed' });
    });
};


module.exports = {
  getSearchTbr,
  updatePaymentstatus,
    getBookById,
    Updatedriverstatus,
    createSublocations,
    createBook,
    getSub,
    getBooking,
    getTruckverification,
    deleteSubLocations,
    getSubLocationsById,
    getSubLocations,
    getTruckNumber,
    getTruck,
    getBook,
    delTruck,
    getTruckById,
    createTruck,  
    updateTruck,
    getinvoice,
    getTruckNumber1,  
    createDriver, 
    getVerified,    
    getmobiletruck,     
    // deleteBooking,  
    deleteTruck,
    getDriver,   
    getPaymentUpdate,  
    getBooking1,   
    updateTruckStatus, 
    getTruckNumber2,  
    getTbr,
    updateLoadingStatus,
    updateunloadingStatus,
    createDriving,
    updateDriverStatus,
    updateDriverStatus1,
    updatetruckStatus,
    getTruckStatus
}             