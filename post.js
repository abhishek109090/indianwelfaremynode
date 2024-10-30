const { response } = require('express')
const session = require('express-session');
const express = require('express')

const app = express();

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
// pool.connect((err,connection) => {
//     if (err) {
//       console.error('Error connecting to MySQL:', err.stack);
//       return;
//     }
  
//     console.log('Connected to MySQL as ID:', connection.threadId);
   
//     // Release the connection when done
  
//   });  
const mysql = require('mysql');

// const connection = mysql.createConnection({
//   host: '68.178.149.116', 
//   port:'3306',
//   user: 'truckbooking',
//   password: 'truckbooking',
//   database: 'truckbooking',
 
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
// // Note: Avoid calling pool.connect() multiple times as it's not needed for a pool.

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
//   const getAgentInfo=(request,response)=>{
//     pool.query('select "agentType" from agent ',(error,results)=>{
//         if(error){
//             throw error
//         } 
//         const agentTypes = results.rows.map((row) => row.agentType);
      

// response.json(agentTypes);
//     })
// }
 
const getPostDate=(request,response)=>{
    const {from , to,crn} = request.query;
    console.log(`Fetching data for date range11: from ${from} to ${to}`); // Add a log statement to check query parameters

    pool.query('select * from post where  `date` >= ? AND `date` <= ? AND crn = ?',[from,to,crn],(error,results)=>{
        if(error){
            throw error
        }   
        response.status(200).json(results)  

    })      
}
const getPostTruck=(request,response)=>{
    const { truckNumber,crn } = request.query;
    console.log(`Fetching data for date range: ${truckNumber}`); // Add a log statement to check query parameters
    pool.query('select * from booking where  truckNumber=? and crn=?',[truckNumber,crn],(error,results)=>{
        if(error){   
            throw error  
        }   
        response.status(200).json(results)

    })
}
const getLocation=(request,response)=>{
    const { loadingSublocations,unloadingSublocations } = request.query;

    pool.query('select loadingSublocations,unloadingSublocations from post ',(error,results)=>{
        if(error){
            throw error
        }
        response.status(200).json(results)

    })
}
const getPost = (request, response) => {
  const { crn } = request.query;
  pool.query('SELECT * FROM post WHERE crn=?', [crn], (error, results) => {
      if (error) {
          console.error('Error fetching data:', error);  
          response.status(500).send('Internal Server Error');
          return;
      }         
      response.status(200).json(results);    
  });        
};
const getPincode = (request, response) => {
  const { pincode } = request.params;
  pool.query('SELECT pincode, sublocation,location FROM pincodetable WHERE pincode = ?', [pincode], (error, results) => {
      if (error) {
          console.error('Error fetching data:', error);
          response.status(500).send('Internal Server Error');
          return;
      }
      response.status(200).json(results);  
  }); 
};    
const getTruckpostStatus = (request, response) => {
  const { truckNumber } = request.params;
  pool.query('SELECT * FROM post WHERE truckNumber = ? ORDER BY date DESC, id DESC LIMIT 1', [truckNumber], (error, results) => {
      if (error) {  
          console.error('Error fetching data:', error);       
          response.status(500).send('Internal Server Error');  
          return;  
      }  
      response.status(200).json(results);
  }); 
}; 
const getSelectedPincode = (request, response) => {
  const { pincode, sublocation } = request.params;
  

  const query = `SELECT location, mainLocation, sublocation,pincode FROM pincodetable WHERE pincode = ? AND sublocation = ?`;

  pool.query(query, [pincode, sublocation], (error, results) => {
    if (error) {
      console.error('Error fetching data:', error);
      response.status(500).json({ error: 'Internal Server Error' });
      return; 
    }    
   
    if (results.length === 0) {
      response.status(404).json({ error: 'Location details not found for the specified pincode and sublocation.' });
    } else {  
      response.status(200).json(results[0]);  
      console.log('Location Details:', results[0]);
    }
  });
};     
const addPincodeLocation = (request, response) => {
  const { location, mainlocation, sublocation, pincode } = request.body;

  const query = `
    INSERT INTO pincodetable (location, mainlocation, sublocation, pincode)
    VALUES (?,?,?,?)
  `;

  pool.query(query, [location, mainlocation, sublocation, pincode], (error, results) => {
    if (error) {
      console.error('Error inserting data:', error);
      response.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    response.status(201).send('Location details added successfully');
  });
};

const getPostStatus = (request, response) => {   
    const { crn, truckNumber } = request.query;
  
    pool.query('SELECT * FROM post WHERE crn = ? AND truckNumber = ?', [crn, truckNumber], (error, postResults) => {
      if (error) {
        throw error;
      }
  
      // Check if the truck is already posted
      if (postResults.length > 0) {
        const post = postResults[0];  
  
        // Check if the posted date has expired
        const currentDate = new Date();
        const postedDate = new Date(post.date); // Assuming you have a "date" column
        const daysDifference = (currentDate - postedDate) / (1000 * 60 * 60 * 24); // Calculate the difference in days
  
        if (daysDifference <= 2) {
          // The posted date is within the last 2 days, disallow reposting
          response.status(200).json({ canPost: false, message: 'Truck already posted within the last 2 days.' });
          return;
        }
  
        // Now, check if there's a previous booking
        pool.query(
          'SELECT * FROM booking WHERE truckNumber = ? ORDER BY date DESC LIMIT 1',
          [truckNumber],
          (bookingError, bookingResults) => {
            if (bookingError) {
              throw bookingError;
            }    
  
            if (bookingResults.length > 0) {
              const lastBooking = bookingResults.rows[0];
              const bookingDate = new Date(lastBooking.date);
  
              if (lastBooking.status === 'active' && currentDate > bookingDate) {
                // Previous booking is completed, and the booking date has expired
                response.status(200).json({ canPost: true });
              } else {
                // Previous booking is either not completed or its booking date has not expired
                response.status(200).json({ canPost: false, message: 'Truck already booked by an agent.' });
              }    
            } else {
              // No previous booking exists, allow reposting
              response.status(200).json({ canPost: true });
            }  
          }
        );
      } else {
        // The truck is not posted, allow posting
        response.status(200).json({ canPost: true });
      }
    });
  };
  
const getPostById=(request,respose)=>{
    const id = parseInt(request.params.id)
    pool.query('select * from post where id=?',[id],(error,results)=>{
        if(error){
            throw error
        }
        respose.status(200).json(results)
    })
}
const getbookingstatustrack=(request,respose)=>{
  const {truckNumber,date,time} = request.body
  console.log('trucknumber',truckNumber)

  pool.query('SELECT * FROM post WHERE truckNumber = ? AND date = ? AND time = ?;',[truckNumber,date,time],(error,results)=>{
      if(error){
          throw error
      }
      respose.status(200).json(results)
      console.log(results)
  })
}
const getPostByTruck=(request,respose)=>{
    const truckNumber = parseInt(request.params.id)
    pool.query('select * from post where truckNumber=?',[truckNumber],(error,results)=>{
        if(error){
            throw error
        }
        respose.status(200).json(results)
    })
}
const getPostBypincode=(request,respose)=>{
  const pincode = parseInt(request.params.id)
  pool.query('select * from Srikakulam where PINCODES=?',[pincode],(error,results)=>{
      if(error){
          throw error 
      }
      respose.status(200).json(results)
  })  
}     
const getUpdateBypincode = (request, response) => {
  const id = parseInt(request.params.id);
  const {
    COUNTRY,
    STATE,
    DISTRICT,
    MANDAL,
    VILLAGES,
    PINCODES
  } = request.body;
console.log(request.body)
  pool.query(
    'UPDATE Srikakulam SET COUNTRY = ?, STATE = ?, DISTRICT = ?, MANDAL = ?, VILLAGES = ?, PINCODES = ? WHERE id = ?',
    [COUNTRY, STATE, DISTRICT, MANDAL, VILLAGES, PINCODES, id],
    (error, results) => {
      if (error) {
        throw error;
      }
      response.status(200).json(results);
      console.log(results)
    }  
  );
};

const createPost=(request,response)=>{

   const {  
    truckNumber,
   date,  
   from,
   time,
   to,
   loadingSublocations,
   unloadingSublocations,
   ton,
   kilometer,   
   pricePerTonKm,
       
   crn,          
   truckPostingID
   }=request.body
   console.log(request.body)
   pool.query('insert into post (truckNumber, date, time, `from`, `to`, loadingSublocations,unloadingSublocations,ton,kilometer,pricePerTonKm, crn,truckPostingID ) values(?,?,?,?,?,?,?,?,?,?,?,?)',[ truckNumber,  date, time,from, to,loadingSublocations,unloadingSublocations,ton,kilometer,pricePerTonKm,crn,truckPostingID],(error,results)=>{
    if(error){
        throw error
    }
    response.status(200).send(`post truck add with id:${results.insertId}`)
   })
}
const createPost1=(request,response)=>{
    const {  
     truckNumber,
    date,
    from, 
    time,
    to,
    loadingSublocations,
    unloadingSublocations,
    ton,
   kilometer,      
   pricePerTonKm,  

    crn,  
    truckPostingID
    }=request.body
    pool.query('insert into post1 (truckNumber, date, time,`from`, `to`, loadingSublocations,unloadingSublocations,ton,kilometer,pricePerTonKm, crn,truckPostingID ) values(?,?,?,?,?,?,?,?,?,?,?,?)',[ truckNumber,  date, time,from, to,loadingSublocations,unloadingSublocations,ton,kilometer,pricePerTonKm,crn,truckPostingID],(error,results)=>{
     if(error){
         throw error  
     }  
     response.status(200).send(`post truck add with id:${results.insertId}`)
    })   
 }
const updatePost=(request,response)=>{
    const id=parseInt(request.params.id)
    const{ 
        registrationNumber,
        date,
        from,
        time,
        to,
        loadingSublocations,
        unloadingSublocations,
                    crn,
    }=request.body
    pool.query('update post set "registrationNumber"=$2, date=$3, "time"=$4, "from"=$5, "to"=$6, sublocations=$7, crn=$8,"loadingSublocations"=$9,"unloadingSublocations"=$10 where id=$1',[ registrationNumber,  date, time, from,to,crn,loadingSublocations,unloadingSublocations],(error,results)=>{
        if(error){
            throw error
        }
        response.status(200).send(`truck updated with id:${id}`) 
       })
}   
const deletePost = (request, response) => {
    const id = parseInt(request.params.id);
    pool.query('DELETE FROM post WHERE id=?', [id], (error, results) => {
      if (error) {
        console.error("Error deleting from post table:", error);
        response.status(500).json({ error: "Internal server error" });
        return;
      }
      response.status(200).send(`Deleted truck with id: ${id} from post table.`);
    });
  };
   
  const deletePost1 = (request, response) => {
    const id = parseInt(request.params.id);
    pool.query('DELETE FROM post1 WHERE id=?', [id], (error, results) => {
      if (error) {
        console.error("Error deleting from post1 table:", error);
        response.status(500).json({ error: "Internal server error" });
        return;
      }
      response.status(200).send(`Deleted truck with id: ${id} from post1 table.`);
    });  
  };     
const setPost=(request,response)=>{
    const truckNumber=parseInt(request.params.id)
    pool.query('select "truckNumber" FROM post  WHERE "truckNumber"=$1',[truckNumber],(error,results)=>
    {
        if(error){  
            throw error
        }
        response.status(200).send(` deleted  truck with id:${id}`)
    })
}

const sublocation = (request, response) => {
  const { location } = request.query; // Use req.query instead of req.params
  console.log('Received request for location:', location);

  if (!location) {
    return response.status(400).json({ error: 'Location parameter is required' });
  }

  const query = `SELECT * FROM sublocation WHERE ${location} IS NOT NULL`;
  const values = [];

  pool.query(query, values, (error, results) => {
    if (error) {
      console.error('Error fetching sublocations:', error);
      response.status(500).json({ error: 'Internal Server Error' });
    } else {
      console.log('results',results)
      const sublocations = results.map((result) => result.sublocation);
      console.log('Sublocations:', sublocations);
      response.status(200).json({ results });
    }              
  });                                   
};  
function requireAuth(req, res, next) {
    if (!req.session.crn) {
      // User is not authenticated, redirect to the login page or send an unauthorized response
      return res.status(401).json({ message: 'Unauthorized' });
    }
    // User is authenticated, continue to the next middleware or route handler
    next();
  }   
  
  // Example protected route using the requireAuth middleware
  app.get('/protected-route', requireAuth, (req, res) => {
    // This route is protected and can only be accessed by authenticated users
    res.json({ message: 'This is a protected route.' });
  });
module.exports = {
    getLocation,
    getPostTruck,
    getPostDate,
    getPost,
    setPost,
    getPostStatus,
    getPostById,
    createPost,
    createPost1,
    updatePost,
    deletePost1,
    deletePost,
    getPostByTruck,
    getPincode,
    getSelectedPincode,
    getPostBypincode,
    getUpdateBypincode,
    sublocation,
    getTruckpostStatus,
    addPincodeLocation,
    getbookingstatustrack
}       