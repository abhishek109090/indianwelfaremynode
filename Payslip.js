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
  const payslip = (req, res) => {
  
    const {
        employeeName,
        employeeId,
        designation,
        department,
        dateOfJoining,
        grossSalary,
        uan,
        totalWorkingDays,
        lopDays,
        paidDays,
        basicSalary,
        houseRentAllowances,
        professionalAllowances,
        conveyance,
        otherAllowances,
        professionalTax,
        epf,
        eps,
        totalDeductions,
        netPay,
        amountInWords,
        grosspay,
        currentMonthYear
      } = req.body;
    console.log(req.body)
      const sql = `
        INSERT INTO payslips (
          employeeName,
          employeeId,
          designation,
          department,
          dateOfJoining,
          grossSalary,
          uan,
          totalWorkingDays,
          lopDays,
          paidDays,
          basicSalary,
          houseRentAllowances,
          professionalAllowances,
          conveyance,
          otherAllowances,
          professionalTax,
          epf,
          eps,
          totalDeductions,
          netPay,
          amountInWords,
          grosspay,
          currentMonthYear
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?)
      `;
    
      const values = [
        employeeName,
        employeeId,
        designation,
        department,
        dateOfJoining,
        grossSalary,
        uan,
        totalWorkingDays,
        lopDays,
        paidDays,
        basicSalary,
        houseRentAllowances,
        professionalAllowances,
        conveyance,
        otherAllowances,
        professionalTax,
        epf,
        eps,
        totalDeductions,
        netPay,
        amountInWords,
        grosspay,
        currentMonthYear
      ];
    
      pool.query(sql, values, (err, result) => {
        if (err) {
          console.error('Error inserting data:', err);
          res.status(500).json({ error: 'Failed to insert data' });
          return;
        }
        console.log("submitted")
        res.status(200).json({ message: 'Payslip saved successfully' });
      });
  }; 
  const fetchpayslip = (request, response) => {
  
    pool.query('SELECT * from payslips',  (error, results) => {
        if (error) {
            console.error('Error fetching data:', error);
            response.status(500).send('Internal Server Error');
            return;
        }
        console.log(results)
        response.status(200).json(results);  
    }); 
  }; 
  module.exports={
    payslip,
    fetchpayslip
  }
