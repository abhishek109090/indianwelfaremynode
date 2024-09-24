const express = require("express")
const mysql = require('mysql');
const multer = require('multer');

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

  const insertOfferLetterDataIntoDB = async (offerLetterData) => {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO offer SET ?';
      pool.query(query, offerLetterData, (err, results) => {
        if (err) {
          return reject(err);
        }
        resolve(results);
      });
    });
  };
  
  const offer = async (req, res) => {
    try {
      const {
        date,
        position,
        joiningDate,
        ref,
        name,
        addressLine1,
        addressLine2,
        city,
        state,
        country,
        zip,
        location,
        
      } = req.body;
  
     
  
      // Generate a random 6-digit number
      const random = Math.floor(100000 + Math.random() * 900000);
  
      // Insert data into the database
      const results = await insertOfferLetterDataIntoDB({
        ...req.body,
       
        random  // Include the random number
      });
  
      console.log('Form data submitted:', req.body);
      res.status(200).send(`Offer letter added with ID: ${results.insertId}`);
    } catch (error) {
      console.error('Error submitting form data:', error);
      res.status(500).send('Internal Server Error');
    }
  };
  
  
  const fetchoffer = (request, response) => {
  
    pool.query('SELECT * from offer',  (error, results) => {
        if (error) {
            console.error('Error fetching data:', error);
            response.status(500).send('Internal Server Error');
            return;
        }
        response.status(200).json(results);  
    }); 
  };    
  const verifyuser = (req, res) => {
  
    const { ref, joiningDate } = req.body;
console.log(ref,joiningDate)
  // Query to check reference number and dob in the database
  const query = 'SELECT * FROM offer WHERE ref = ? AND joiningDate = ?';

  pool.query(query, [ref, joiningDate], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results.length > 0) {
      // Assuming only one row matches, return that row's data
      const employee = results[0];
      if (employee.joining=="inactive") {
        res.json(employee); // If inactive, send the employee data
      } else {
        res.status(400).json({ error: 'You have already registered' }); // If active, send error message
      }
    } else {
      res.status(401).json({ error: 'Invalid reference number or joining date' });
    }
  });
};

  const record = (request, response) => {
  
    pool.query('SELECT * from checknode',  (error, results) => {
        if (error) {
            console.error('Error fetching data:', error);
            response.status(500).send('Internal Server Error');
            return;
        }
        response.status(200).json(results);  
    }); 
  };   
  const updateoffer = (req, res) => {
  
    const id = req.params.id;
    const updateData = req.body;
  console.log(req.body)
    pool.query('UPDATE offer SET ? WHERE id = ?', [updateData, id], (err, result) => {
      if (err) {
        console.error('Error updating offer:', err);
        res.status(500).json({ error: 'Error updating offer' });
        return;
      }
      res.json({ message: 'Offer updated successfully' });
    });
  };  
  const verifypass = (req, res) => {
  
    const { passcode } = req.body;
console.log(req.body)
    // Perform query to verify passcode
    const query = `SELECT * FROM verify WHERE passcode = ?`;
    pool.query(query, [passcode], (err, results) => {
      if (err) {
        console.error('Error querying MySQL:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
  
      if (results.length > 0) {
        res.json({ isValid: true });
      } else {
        res.json({ isValid: false });
      }
    });
  };   
  const updatedel = (req, res) => {
  
    const offerId = req.params.id;
    const { letterstatus } = req.body;
  
    if (letterstatus !== 'inactive') {
      return res.status(400).json({ error: 'Invalid status value' });
    }
  
    const query = 'UPDATE offer SET letterstatus = ? WHERE id = ?';
    pool.query(query, [letterstatus, offerId], (err, results) => {
      if (err) {
        console.error('Error updating offer status:', err);
        return res.status(500).json({ error: 'Database error' });
      }
  
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: 'Record not found' });
      }
  
      res.json({ message: 'Record updated successfully' });
    });
  };   
module.exports={
    offer,
    fetchoffer,
    record,
    verifyuser,
    updateoffer,
    verifypass,
    updatedel
}