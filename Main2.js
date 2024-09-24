const express = require("express")
const mysql = require('mysql');
const multer = require('multer');

const dotenv = require('dotenv');
dotenv.config();
const pool = mysql.createPool({
    // connectionLimit: 10, // Adjust as needed
    host: '107.180.116.73',
    port: '3306',
    user: 'rvlc82',
    password: 'MRVTechnology@123',
    database: 'Admin',
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
 
  const A1=(req,res)=>{
    const { emp_id, start_date, end_date } = req.query;


    

    const query = `
        SELECT date, start_time, end_time 
        FROM Employeeattendance 
        WHERE emp_id = ? AND date >= ? AND date <= ?
        ORDER BY date ASC
    `;
    
    

    pool.query(query, [emp_id, start_date, end_date], (error, results) => {
        if (error) {
            console.error('Error fetching attendance data:', error);
            return res.status(500).json({ error: 'Database query failed' });
        }
        
       
        if (results.length === 0) {
            console.log('No results found for the given query parameters.');
        }

        res.json(results); // Send raw data
    });
  }
  const A2=(req,res)=>{
    const { email, password, loggedstatus } = req.body;
    console.log(req.body)
      // Check if the email exists in the database
      pool.query('SELECT * FROM employee WHERE employeeemail = ?', [email], async (err, results) => {
        if (err) {
          return res.status(500).send('Database query failed.');
        }
    
        if (results.length === 0) {
          return res.status(404).send('User not found.');
        }
    
        // Hash the new password using bcrypt
       
    
        // Update the password and logged status in the database
        pool.query(
          'UPDATE employee SET emppassword = ?, passwordstatus = ? WHERE employeeemail = ?',
          [password, loggedstatus, email],
          (err, result) => {
            if (err) {
              return res.status(500).send('Failed to update password.');
            }
    
            res.status(200).send('Password updated successfully.');
          }
        );
      });
  }
  const A3=(req,res)=>{
    const { emp_id, activestatus } = req.body;

    // Check if the emp_id is provided
    if (!emp_id) {
        return res.status(400).send('Employee ID is required.');
    }
  
    // Update the employee's active status in the database
    const query = 'UPDATE employee SET activestatus = ? WHERE emp_id = ?';
  
    pool.query(query, [activestatus, emp_id], (err, result) => {
        if (err) {
            return res.status(500).send('Failed to update employee status.');
        }
  
        if (result.affectedRows === 0) {
            return res.status(404).send('Employee not found.');
        }
  
        res.status(200).send('Employee status updated successfully.');
    });
  }
  const A4=(req,res)=>{
    const { start_date, end_date } = req.query;

    // Updated query to account for leaves, worked days, and absent days
    const query = `
      SELECT e.emp_id, e.employeename,
             COUNT(CASE WHEN ea.start_time IS NOT NULL AND ea.start_time != 'Leave' THEN 1 END) AS actual_worked_days,
             COUNT(CASE WHEN ea.start_time = 'Leave' THEN 1 END) AS leaves_taken,
             COUNT(CASE WHEN ea.start_time IS NULL THEN 1 END) AS absent_days
      FROM employee e
      LEFT JOIN Employeeattendance ea ON e.emp_id = ea.emp_id AND ea.date BETWEEN ? AND ?
      GROUP BY e.emp_id, e.employeename
      ORDER BY e.employeename ASC;
    `;
  
    // Executing the query
    pool.query(query, [start_date, end_date], (error, results) => {
      if (error) {
        console.error('Error fetching attendance data:', error);
        return res.status(500).json({ error: 'Database query failed' });
      }  
  
      res.json(results); // Send aggregated data in response
    });
  }
  const A5=(req,res)=>{
    const { emp_id, start_date, end_date } = req.query;

    console.log('Request query parameters:', req.query);
  
    const query = `
        SELECT date, start_time, end_time 
        FROM Teamleaderattendance 
        WHERE emp_id = ? AND date >= ? AND date <= ?
        ORDER BY date ASC
    `;
    
  
  
    pool.query(query, [emp_id, start_date, end_date], (error, results) => {
        if (error) {
            console.error('Error fetching attendance data:', error);
            return res.status(500).json({ error: 'Database query failed' });
        }
        
        console.log('Query results:', results);
        if (results.length === 0) {
            console.log('No results found for the given query parameters.');
        }
  
        res.json(results); // Send raw data
    });
  }
  const A6=(req,res)=>{
    const sql = 'SELECT * FROM Company_Holidays';
    pool.query(sql, (err, results) => {
      if (err) throw err;
      res.json(results);
    });
  }
  const A7=(req,res)=>{
    const newHoliday = req.body;
    const sql = 'INSERT INTO Company_Holidays SET ?';
    pool.query(sql, newHoliday, (err, result) => {
      if (err) throw err;
      res.json(result);
    });
  }

  const A8=(req,res)=>{
    const { id } = req.params;
    const sql = `DELETE FROM Company_Holidays WHERE id = ${id}`;
    pool.query(sql, (err, result) => {
      if (err) throw err;
      res.json(result);
    });
  }
  const A9=(req,res)=>{
    const query = 'SELECT date, name FROM Company_Holidays';

    pool.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching holidays:', err);
            res.status(500).json({ error: 'Failed to fetch holidays' });
            return;
        }
        res.json(results);
    });
  }
  const A10=(req,res)=>{
    const { emp_id, activity } = req.body;

    const query = 'INSERT INTO employee_activity (emp_id, activity, timestamp) VALUES (?, ?, ?)';
    pool.query(query, [emp_id, JSON.stringify(activity), activity.timestamp], (err, result) => {
        if (err) {
            console.error('Error tracking activity:', err);
            return res.status(500).send('Failed to track activity.');
        }
        res.status(200).send('Activity tracked successfully.');
    });
  }
  const A11=(req,res)=>{
    const empId = req.params.emp_id;

    const query = `SELECT * FROM tasks WHERE FIND_IN_SET(?, emp_id) > 0`;
  
    pool.query(query, [empId], (err, results) => {
        if (err) {
            console.error('Error fetching tasks:', err);
            res.status(500).json({ error: 'Error fetching tasks' });
        } else {
            res.json(results);
        }
    });
  }
  const A12=(req,res)=>{
    const { emp_id, date } = req.body;

    // Query to check if the end work is updated for the given employee and date
    const query = `SELECT end_time FROM adminattandence WHERE emp_id = ? AND date = ?`;
  
    pool.query(query, [emp_id, date], (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).json({ error: 'Database error' });
        }
  
        if (result.length > 0) {
            // If endTime exists and is not null, it means the work is already ended
            const endTime = result[0].endTime;
            if (endTime) {
                res.json({ endWorkUpdated: true, endTime });
            } else {
                res.json({ endWorkUpdated: false });
            }
        } else {
            // No record found for the given emp_id and date
            res.json({ endWorkUpdated: false });
        }
    });
  }
  const A13=(req,res)=>{
    const query = 'SELECT emp_id, employeename FROM employee'; // Query to get emp_id and employee_name
    pool.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching employee data:', err);
        res.status(500).json({ error: 'Failed to fetch employee data' });
      } else {
        res.json(results); // Send the result as JSON
      }
    });
  }
  const A14=(req,res)=>{
    const { emp_id, permissiontime, date } = req.body;

    // Check if emp_id ends with -E1, -E2, etc. or -TL1, -TL2, etc.
    const employeePattern = /-E\d+$/;
    const teamLeaderPattern = /-TL\d+$/;
  
    let tableName;
    if (employeePattern.test(emp_id)) {
      tableName = 'Employeeattendance';
    } else if (teamLeaderPattern.test(emp_id)) {
      tableName = 'Teamleaderattendance';
    } else {
      return res.status(400).json({ message: 'Invalid employee ID format' });
    }
  
    // Insert data into the appropriate table
    const query = `INSERT INTO ${tableName} (emp_id, permission_time, date) VALUES (?, ?, ?)`;
    pool.query(query, [emp_id, permissiontime, date], (err, results) => {
      if (err) {
        console.error('Failed to update login time:', err);
        return res.status(500).json({ message: 'Failed to update login time' });
      }
      res.json({ message: 'Login time updated successfully' });
    });
  }
  const filterWorkingDays = (startDate, endDate, holidays) => {
    const date = new Date(startDate);
    const end = new Date(endDate);
    const validDays = [];
  
    while (date <= end) {
        const formattedDate = date.toISOString().split('T')[0];
        const isSunday = date.getDay() === 0; // Check if it's a Sunday
        const isHoliday = holidays.includes(formattedDate); // Check if it's a holiday
  
        if (!isSunday && !isHoliday) {
            validDays.push(formattedDate); // Add valid working day
        }
  
        date.setDate(date.getDate() + 1); // Move to the next day
    }
  
    return validDays;
  };
  
  // Helper function to fetch holidays from the database
  const fetchHolidaysFromDB = () => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT date FROM Company_Holidays'; // Adjust your table and column names as needed
        pool.query(query, (err, results) => {
            if (err) {
                return reject(err);
            }
            // Extract dates from query results and return them as an array
            const holidays = results
            .map(row => {
                if (row.holiday_date) {    
                    try {
                        return row.holiday_date.toISOString().split('T')[0];
                    } catch (error) {
                        console.error('Invalid date format:', row.holiday_date, error);
                        return null;
                    }
                }  
                return null; // Handle case where holiday_date is null
            })
            .filter(date => date !== null); // Remove any invalid or null dates
  
        resolve(holidays);
    });
  });
  };
  
  const A15=async(req,res)=>{
    const { emp_id, start_date, end_date } = req.body;

    // Check if emp_id ends with -E1, -E2, etc. or -TL1, -TL2, etc.
    const employeePattern = /-E\d+$/;
    const teamLeaderPattern = /-TL\d+$/;
  
    let tableName;
    if (employeePattern.test(emp_id)) {
        tableName = 'Employeeattendance';
    } else if (teamLeaderPattern.test(emp_id)) {
        tableName = 'Teamleaderattendance';
    } else {
        return res.status(400).json({ message: 'Invalid employee ID format' });
    }
  
    try {
        // Fetch holidays from the database
        const holidays = await fetchHolidaysFromDB();
  
        // Get the list of valid working days for the leave period
        const validLeaveDates = filterWorkingDays(start_date, end_date, holidays);
  
        if (validLeaveDates.length === 0) {
            return res.status(400).json({ message: 'No valid working days in the given range' });
        }
  
        // Prepare the SQL query to insert records
        const insertQuery = `INSERT INTO ${tableName} (emp_id, date, start_time, end_time) VALUES ?`;
  
        // Create the data array for multiple rows
        const data = validLeaveDates.map(date => [emp_id, date, 'leave', 'leave']);
  
        // Execute the query to insert multiple rows
        pool.query(insertQuery, [data], (err, results) => {
            if (err) {
                console.error('Failed to insert leave records:', err);
                return res.status(500).json({ message: 'Failed to insert leave records' });
            }
            res.json({ message: 'Leave records updated successfully' });
        });
    } catch (err) {
        console.error('Failed to fetch holidays or update leave records:', err);
        return res.status(500).json({ message: 'Failed to fetch holidays or update leave records' });
    }
  }

  module.exports={
    A1,
    A2,
    A3,
    A4,
    A5,
    A6,
    A7,
    A8,
    A9,
    A10,
    A11,
    A12,
    A13,
    A14,
    A15
  }