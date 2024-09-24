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
        employeeCode,
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
        otherdeductions,
        grossdeductions,
        currentMonthYear,

        
      } = req.body;
    console.log(req.body)
      const sql = `
        INSERT INTO payslips (
          employeeName,
          employeeCode,
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
          otherdeductions,
          grossdeductions,
          currentMonthYear
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?)
      `;
     
      const values = [
        employeeName,
        employeeCode,
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
        otherdeductions,
        grossdeductions,
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
    const query = `
      SELECT p.*, e.BankName, e.BankAccountNo, e.Zone, e.Division, e.Branch,e.Location,e.Department,e.Designation 
      FROM payslips p
      LEFT JOIN Employeepayslip e ON p.employeeCode = e.employeeCode
    `;
  
    pool.query(query, (error, results) => {
      if (error) {
        console.error('Error fetching data:', error);
        response.status(500).send('Internal Server Error');
        return;
      }
      // Log the full results
      console.log("Results from DB: ", results); 
  
      // Send the data as JSON (no `results.rows`, just `results`)
      response.status(200).json(results);  // Assuming it's an array of records
    });
  };
  
  
  
  const fetchempname = (req, res) => {
  console.log('get')
    const query = `SELECT EmployeeName FROM Employeepayslip`;

    pool.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching employee names:', err);
            res.status(500).send('Error fetching employee names');
        } else {
            res.json(results); // Send all employee names
        }
    });
  }; 
  const fetchemp = (req, res) => {
   
    const employeeName = req.params.name;
console.log(employeeName)
    const query = `SELECT * FROM Employeepayslip WHERE EmployeeName = ?`;

    pool.query(query, [employeeName], (err, results) => {
        if (err) {
            console.error('Error fetching employee data:', err);
            res.status(500).send('Error fetching employee data');
        } else {
            if (results.length > 0) {
                res.json(results[0]); // Send the first matching result
            } else {
                res.status(404).send('Employee not found');
            }
        }
    });
  }; 
  const updatepayslip = (req, res) => {
  
    const id = req.params.id;
    const {
      employeeName,
      employeeCode,
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
      otherdeductions,
      grossdeductions,
      currentMonthYear
    } = req.body;
  
    // Update query
    const updateQuery = `
      UPDATE payslips
      SET 
        employeeName = ?, 
        employeeCode = ?, 
        designation = ?, 
        department = ?, 
        dateOfJoining = ?, 
        grossSalary = ?, 
        uan = ?, 
        totalWorkingDays = ?, 
        lopDays = ?, 
        paidDays = ?, 
        basicSalary = ?, 
        houseRentAllowances = ?, 
        professionalAllowances = ?, 
        conveyance = ?, 
        otherAllowances = ?, 
        professionalTax = ?, 
        epf = ?, 
        eps = ?, 
        totalDeductions = ?, 
        netPay = ?, 
        amountInWords = ?, 
        grosspay = ?, 
        otherdeductions = ?, 
        grossdeductions = ?, 
        currentMonthYear = ?
      WHERE id = ?`;
  
    // Execute the update query
    pool.query(
      updateQuery,
      [
        employeeName,
        employeeCode,
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
        otherdeductions,
        grossdeductions,
        currentMonthYear,
        id
      ],
      (err, result) => {
        if (err) {
          console.error('Failed to update payslip:', err);
          res.status(500).send('Failed to update payslip');
          return;
        }
        res.send('Payslip updated successfully');
      }
    );
  };  
  const deletepayslip = (req, res) => {
   
    const { id } = req.params;

    // Delete query
    const deleteQuery = 'DELETE FROM payslips WHERE id = ?';
  
    // Execute the delete query
    pool.query(deleteQuery, [id], (err, result) => {
      if (err) {
        console.error('Failed to delete payslip:', err);
        res.status(500).send('Failed to delete payslip');
        return;
      }
  
      if (result.affectedRows === 0) {
        res.status(404).send('Payslip not found');
        return;
      }
  
      res.send('Payslip deleted successfully');
    });
  }; 
  module.exports={
    payslip,
    fetchpayslip,
    fetchempname,
    fetchemp,
    updatepayslip,
    deletepayslip
  }