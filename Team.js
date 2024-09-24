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
        `INSERT INTO Teamleaderattendance (emp_id, date, start_time) VALUES (?, ?, ?)`,
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
      `UPDATE Teamleaderattendance 
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

const teamattandence=(req,res)=>{
  const { emp_id, year, month } = req.query;
    console.log(req.query);

    const monthsToQuery = [month];

    // Add the previous month
    const previousMonth = month === '1' ? '12' : (parseInt(month) - 1).toString();
    monthsToQuery.push(previousMonth);

    const query = `
        SELECT date, start_time, end_time
        FROM Teamleaderattendance
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
const team1=(req,res)=>{
  const query = 'SELECT * FROM teamleaders';
  pool.query(query, (err, results) => {
      if (err) throw err;
      res.json(results);
  });
}
const team2=(req,res)=>{
  const query = 'SELECT COUNT(*) AS count FROM teamleaders';
  pool.query(query, (err, result) => {
        if (err) throw err;
        res.json(result[0]);
    });
}
const team3=(req,res)=>{
  const { teamleadername, teamleaderphone, teamleaderref, teamleaderemail, emp_id } = req.body;
  const query = 'INSERT INTO teamleaders (teamleadername, teamleaderphone, teamleaderref, teamleaderemail, emp_id) VALUES (?, ?, ?, ?, ?)';
  pool.query(query, [teamleadername, teamleaderphone, teamleaderref, teamleaderemail, emp_id], (err, result) => {
      if (err) throw err;
      res.json({ id: result.insertId, ...req.body });
  });
}
const teamemp1=(req,res)=>{
    const query = 'SELECT * FROM employee';
    pool.query(query, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
  }
  const teamemp2=(req,res)=>{
    const query = 'SELECT COUNT(*) AS count FROM employee';
    pool.query(query, (err, result) => {
          if (err) throw err;
          res.json(result[0]); 
      });
  }
  const teamemp3=(req,res)=>{
    const { employeename, employeephone, employeeemail, employeeref, emp_id } = req.body;
    console.log(req.body)
    const query = 'INSERT INTO employee (employeename, employeephone, employeeemail, employeeref, emp_id) VALUES (?, ?, ?, ?, ?)';
    pool.query(query, [employeename, employeephone, employeeemail, employeeref, emp_id], (err, result) => {
        if (err) throw err;
        res.json({ id: result.insertId, ...req.body });
    });  
  }
  const teamemp4=(req,res)=>{
    const { emp_id } = req.body;
    const date1 = new Date();

    // Extract the date portion in 'YYYY-MM-DD' format
    const date = date1.toISOString().split('T')[0];
    const query = 'INSERT INTO Teamleaderattendance (emp_id, date, start_time, end_time) VALUES (?, ?, "Leave", "Leave")';
    
    pool.query(query, [emp_id,date], (err, result) => {
        if (err) {
            console.error('Error inserting leave record:', err);
            return res.status(500).json({ error: 'Failed to take leave. Please try again.' });
        }
        console.log('Leave taken:', result);
        res.status(200).json({ message: 'Leave taken successfully.' });
    });
};
const teamemp5=(req,res)=>{
    const { emp_id, date } = req.query;

console.log(date)
    const query = `SELECT start_time, end_time FROM Teamleaderattendance WHERE emp_id = ? AND date = ?`;

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
const leave=(req,res)=>{
    const { emp_id, start_date, end_date, title, description } = req.body;
    console.log(req.body)
  const query = `
    INSERT INTO leave_requests (emp_id, start_date, end_date, title, description, status)
    VALUES (?, ?, ?, ?, ?, 'Pending')
  `;
  pool.query(query, [emp_id, start_date, end_date, title, description], (err, results) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send('Leave request created');
    }
  });
  }  
  const fetchLeave = (req, res) => {
    const emp_id = req.params.emp_id; // Assuming emp_id is passed as a URL parameter
    const query = 'SELECT * FROM leave_requests WHERE emp_id = ?';
    console.log(emp_id)
    pool.query(query, [emp_id], (err, results) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.json(results);
      }
    });
  };
  const taskpost = (req, res) => {
    const { emp_id, task_description, date_assigned, teamemp_id } = req.body;

    // Ensure emp_id is an array and not undefined
    if (!Array.isArray(emp_id) || emp_id.length === 0) {
        return res.status(400).send('Employee IDs are required and should be an array');
    }

    // Convert array of employee IDs into a comma-separated string
    const emp_id_str = emp_id.join(','); // Remove curly braces

    const query = `INSERT INTO tasks (emp_id, task_description, date_assigned, teamemp_id) VALUES (?, ?, ?, ?)`;
    pool.query(query, [emp_id_str, task_description, date_assigned, teamemp_id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Failed to assign task');
        }
        res.send('Task assigned successfully');
    });
};

const gettoday = (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const { teamemp_id } = req.body;
console.log(teamemp_id)
  const query = `
    SELECT t.task_id, t.task_description, t.date_assigned, t.status, 
           GROUP_CONCAT(e.employeename SEPARATOR ', ') AS employee_names
    FROM tasks t
    JOIN employee e 
    ON FIND_IN_SET(e.emp_id, t.emp_id)
    WHERE t.date_assigned = ? AND t.teamemp_id = ?
    GROUP BY t.task_id, t.task_description, t.date_assigned, t.status;
  `;

  pool.query(query, [today, teamemp_id], (err, results) => {
      if (err) {
          console.error('Error fetching today\'s tasks:', err);
          return res.status(500).json({ error: 'Error fetching today\'s tasks' });
      }
      res.status(200).json(results);
  });
};

const getprevious = (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const { teamemp_id } = req.body;

  const query = `
    SELECT t.task_id, t.task_description, t.date_assigned, t.status, 
           GROUP_CONCAT(e.employeename SEPARATOR ', ') AS employee_names
    FROM tasks t
    JOIN employee e 
    ON FIND_IN_SET(e.emp_id, t.emp_id)
    WHERE t.date_assigned < ? AND t.teamemp_id = ?
    GROUP BY t.task_id, t.task_description, t.date_assigned, t.status;
  `;

  pool.query(query, [today, teamemp_id], (err, results) => {
      if (err) {
          console.error('Error fetching previous tasks:', err);
          return res.status(500).json({ error: 'Error fetching previous tasks' });
      }
      res.status(200).json(results);
  });
};

  module.exports={  
    startwork,
    endwork,
    teamattandence,
    team1,
    team2,
    team3,
    teamemp1,
    teamemp2,
    teamemp3,
    teamemp4,
    teamemp5,
    leave,
    fetchLeave,
    taskpost,
    gettoday,
    getprevious
  }