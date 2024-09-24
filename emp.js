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

  const startwork = (req, res) => {
    const { emp_id, startTime } = req.body;
    const date1 = new Date();

// Extract the date portion in 'YYYY-MM-DD' format
const date = date1.toISOString().split('T')[0];
    // Extract the date
console.log(req.body)
    pool.query(
        `INSERT INTO Employeeattendance (emp_id, date, start_time) VALUES (?, ?, ?)`,
        [emp_id, date, startTime],
        (err, result) => {
            if (err) {
                console.error('Error starting work:', err);
                return res.status(500).send('Error starting work');
            }
            res.json(result);
        }
    );    
};    
    
const endwork = (req, res) => {
  const { emp_id, endTime } = req.body;
  const date1 = new Date();

  // Extract the date portion in 'YYYY-MM-DD' format
  const date = date1.toISOString().split('T')[0];

  console.log(req.body);

  pool.query(
      `UPDATE Employeeattendance 
       SET end_time = ? 
       WHERE emp_id = ? AND date = ?`,
      [endTime, emp_id, date],
      (err, result) => {
          if (err) {
              console.error('Error ending work:', err);
              return res.status(500).send('Error ending work');
          }
          if (result.affectedRows === 0) {
              return res.status(404).send('Attendance record not found');
          }
          res.json({ message: 'Work ended successfully', emp_id, endTime, date });
      }
  );
};

const empattandence=(req,res)=>{
  const { emp_id, year, month } = req.query;
  console.log(req.query);

  const monthsToQuery = [month];

  // Add the previous month
  const previousMonth = month === '1' ? '12' : (parseInt(month) - 1).toString();
  monthsToQuery.push(previousMonth);

  const query = `
      SELECT date, start_time, end_time
      FROM Employeeattendance
      WHERE emp_id = ? AND YEAR(date) = ? AND MONTH(date) IN (?)
      ORDER BY date ASC
  `;

  pool.query(query, [emp_id, year, monthsToQuery], (err, results) => {
      if (err) {
          console.error('Error fetching attendance data:', err);
          res.status(500).json({ error: 'Failed to fetch attendance data.' });
          return;
      }  
      res.json(results);
  });
}
const empemp5=(req,res)=>{
    const { emp_id, date } = req.query;

console.log(date)
    const query = `SELECT start_time, end_time FROM Employeeattendance WHERE emp_id = ? AND date = ?`;

    pool.query(query, [emp_id, date], (err, results) => {
        if (err) {
            console.error('Error fetching attendance data:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }

        if (results.length > 0) {
            console.log(results)
            res.json(results[0]);
        } else {
            res.status(404).json({ message: 'No attendance record found for today.' });
        }
    });
};
const adminmain = (req, res) => {
    // Get today's date in 'YYYY-MM-DD' format
    const today = new Date().toISOString().split('T')[0];
  
    // Query for Employee Attendance filtered by today's date
    const employeeAttendanceQuery = `
      SELECT 
        e.emp_id, 
        e.employeename, 
        COALESCE(ea.start_time, 'Still not logged in') AS start_time, 
        COALESCE(ea.end_time, 'Still not logged in') AS end_time,
        e.activestatus
      FROM employee AS e
      LEFT JOIN Employeeattendance ea 
        ON e.emp_id = ea.emp_id 
        AND ea.date = '${today}'  -- Ensure the join is only for today's records
      ORDER BY e.employeename;`;
  
    // Query for Team Leader Attendance filtered by today's date
    const teamLeaderAttendanceQuery = `
      SELECT 
        t.emp_id, 
        t.teamleadername, 
        COALESCE(ta.start_time, 'Still not logged in') AS start_time, 
        COALESCE(ta.end_time, 'Still not logged in') AS end_time
      FROM teamleaders AS t
      LEFT JOIN Teamleaderattendance ta 
        ON t.emp_id = ta.emp_id 
        AND ta.date = '${today}'  -- Ensure the join is only for today's records
      ORDER BY t.teamleadername;`;
  
    // Execute both queries and send combined results
    pool.query(employeeAttendanceQuery, (err, employeeResults) => {
      if (err) {
        console.error('Failed to fetch employee attendance records:', err);
        res.status(500).send('Failed to fetch employee attendance records');
        return;
      }
  
      pool.query(teamLeaderAttendanceQuery, (err, teamLeaderResults) => {
        if (err) {
          console.error('Failed to fetch team leader attendance records:', err);
          res.status(500).send('Failed to fetch team leader attendance records');
          return;
        }
  
        // Send the results as JSON
        res.json({
          employees: employeeResults,
          teamLeaders: teamLeaderResults,
        });
      });
    });
  };
  const adminmain1 = (req, res) => {
    // Get today's date in 'YYYY-MM-DD' format
   const {date} = req.query;
  console.log(date)
    // Query for Employee Attendance filtered by today's date
    const employeeAttendanceQuery = `
      SELECT 
        e.emp_id, 
        e.employeename, 
        COALESCE(ea.start_time, 'Still not logged in') AS start_time, 
        COALESCE(ea.end_time, 'Still not logged in') AS end_time
      FROM employee AS e
      LEFT JOIN Employeeattendance ea 
        ON e.emp_id = ea.emp_id 
        AND ea.date = '${date}'  -- Ensure the join is only for today's records
      ORDER BY e.employeename;`;
  
    // Query for Team Leader Attendance filtered by today's date
    const teamLeaderAttendanceQuery = `
      SELECT 
        t.emp_id, 
        t.teamleadername, 
        COALESCE(ta.start_time, 'Still not logged in') AS start_time, 
        COALESCE(ta.end_time, 'Still not logged in') AS end_time
      FROM teamleaders AS t
      LEFT JOIN Teamleaderattendance ta 
        ON t.emp_id = ta.emp_id 
        AND ta.date = '${date}'  -- Ensure the join is only for today's records
      ORDER BY t.teamleadername;`;
  
    // Execute both queries and send combined results
    pool.query(employeeAttendanceQuery, (err, employeeResults) => {
      if (err) {
        console.error('Failed to fetch employee attendance records:', err);
        res.status(500).send('Failed to fetch employee attendance records');
        return;
      }
  
      pool.query(teamLeaderAttendanceQuery, (err, teamLeaderResults) => {
        if (err) {
          console.error('Failed to fetch team leader attendance records:', err);
          res.status(500).send('Failed to fetch team leader attendance records');
          return;
        }
  
        // Send the results as JSON
        res.json({
          employees: employeeResults,
          teamLeaders: teamLeaderResults,
        });
      });
    });
  };
module.exports={
    startwork,
    endwork,
    empattandence,
    empemp5,
    adminmain,
    adminmain1
}