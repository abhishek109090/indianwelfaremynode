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
 
  const teamleader=(req,res)=>{
console.log("ey")
pool.query('select count(*) AS count from teamleaders',(err,results)=>{
  if (err) {
    return res.status(500).send('Error fetching team leader count');
}
console.log(results)
res.json({ count: results[0].count });  
});
  }
  const emp=(req,res)=>{
    console.log("ey")
    pool.query('select count(*) AS count from employee',(err,results)=>{
      if (err) {
        return res.status(500).send('Error fetching team leader count');
    }
    console.log(results)
    res.json({ count: results[0].count });  
    });
      }
   
  const startwork = (req, res) => {
    const { emp_id, startTime } = req.body;
    const date1 = new Date();

// Extract the date portion in 'YYYY-MM-DD' format
const date = date1.toISOString().split('T')[0];
    // Extract the date
console.log(req.body)
    pool.query(
        `INSERT INTO adminattandence (emp_id, date, start_time) VALUES (?, ?, ?)`,
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
      `UPDATE adminattandence 
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
const adminattandence = (req, res) => {
    const { emp_id, year, month } = req.query;
    console.log(req.query);

    const monthsToQuery = [month];

    // Add the previous month
    const previousMonth = month === '1' ? '12' : (parseInt(month) - 1).toString();
    monthsToQuery.push(previousMonth);

    const query = `
        SELECT date, start_time, end_time
        FROM adminattandence
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
};

const adminteam1=(req,res)=>{
  const query = 'SELECT * FROM teamleaders';
  pool.query(query, (err, results) => {
      if (err) throw err;
      res.json(results);
  });
}
const adminteam2=(req,res)=>{
  const query = 'SELECT COUNT(*) AS count FROM teamleaders';
  pool.query(query, (err, result) => {
        if (err) throw err;
        res.json(result[0]);
    });
}
const adminteam3=(req,res)=>{
  const { teamleadername, teamleaderphone, teamleaderref, teamleaderemail, emp_id } = req.body;
  const query = 'INSERT INTO teamleaders (teamleadername, teamleaderphone, teamleadereref, teamleaderemail, emp_id) VALUES (?, ?, ?, ?, ?)';
  pool.query(query, [teamleadername, teamleaderphone, teamleaderref, teamleaderemail, emp_id], (err, result) => {
      if (err) throw err;
      res.json({ id: result.insertId, ...req.body });
  });
}
const adminemp1=(req,res)=>{
    const query = 'SELECT * FROM employee';
    pool.query(query, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
  }
  const adminemp2=(req,res)=>{
    const query = 'SELECT COUNT(*) AS count FROM employee';
    pool.query(query, (err, result) => {
          if (err) throw err;
          res.json(result[0]);
      });
  }
  const adminemp3 = (req, res) => {
    const { employeename, employeephone, employeeemail, employeeref, emp_id, position } = req.body;
    
    console.log(req.body);
    
    const query = 'INSERT INTO employee (employeename, employeephone, employeeemail, EmployeeReference, emp_id, Position) VALUES (?, ?, ?, ?, ?, ?)';
    pool.query(query, [employeename, employeephone, employeeemail, employeeref, emp_id, position], (err, result) => {
        if (err) throw err;
        res.json({ id: result.insertId, ...req.body });
    });
};

  const adminemp4=(req,res)=>{
    const { emp_id } = req.body;
    const date1 = new Date();

    // Extract the date portion in 'YYYY-MM-DD' format
    const date = date1.toISOString().split('T')[0];
    const query = 'INSERT INTO adminattandence (emp_id, date, start_time, end_time) VALUES (?, ?, "Leave", "Leave")';
    
    pool.query(query, [emp_id,date], (err, result) => {
        if (err) {
            console.error('Error inserting leave record:', err);
            return res.status(500).json({ error: 'Failed to take leave. Please try again.' });
        }
        console.log('Leave taken:', result);
        res.status(200).json({ message: 'Leave taken successfully.' });
    });
};
const adminleaverequest = (req, res) => {
    console.log("Fetching leave requests...");

    // Updated query to fetch leave requests, joining with the correct table based on emp_id suffix
    let query = `
        SELECT lr.id,lr.emp_id, lr.start_date, lr.end_date, lr.title, lr.description, lr.status,
        CASE
            WHEN lr.emp_id LIKE '%-TL%' THEN tl.teamleadername
            WHEN lr.emp_id LIKE '%-E%' THEN e.employeename
            ELSE 'Unknown'
        END AS name
        FROM leave_requests lr
        LEFT JOIN teamleaders tl ON lr.emp_id = tl.emp_id AND lr.emp_id LIKE '%-TL%'
        LEFT JOIN employee e ON lr.emp_id = e.emp_id AND lr.emp_id LIKE '%-E%'
    `;

    pool.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
};


const adminleavestatus=(req,res)=>{
    const { id, status } = req.body;
    const query = `UPDATE leave_requests SET status = ? WHERE id = ?`;

    pool.query(query, [status, id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Leave status updated successfully.' });
    });
};
const adminemp5=(req,res)=>{
    const { emp_id, date } = req.query;

console.log(date)
    const query = `SELECT start_time, end_time FROM adminattandence WHERE emp_id = ? AND date = ?`;

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

module.exports={
 teamleader,
 startwork,
 endwork,
 adminattandence,
 adminteam1,
 adminteam2,
 adminteam3,
 adminemp1,
 adminemp2,
 adminemp3,
 adminemp4,
 adminemp5,
 adminleavestatus,
 adminleaverequest,
 emp
}