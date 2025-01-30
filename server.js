const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const pool = require('./db'); 
// Create an express app
const app = express();
app.use(cors());
app.use(express.json()); // To parse JSON bodies


app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Apply JSON parsing only to POST/PUT requests
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    express.json()(req, res, next);
  } else {
    next();
  }
});
// // Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



// New endpoint to get all members with installment details
app.get('/all-members', async (req, res) => {
  const { member_id } = req.query; // Get member_id from query parameters

  try {
    let membersQuery = `
      SELECT m.member_id, m.full_name, m.contribution_amt, 
             i.installment_date, i.installment_amt
      FROM members m
      LEFT JOIN member_installments i ON m.member_id = i.member_id
    `;

    const queryParams = [];
    if (member_id) {
      membersQuery += ` WHERE m.member_id = $1`;
      queryParams.push(member_id);
    }

    membersQuery += ` ORDER BY m.member_id, i.installment_date;`;

    const result = await pool.query(membersQuery, queryParams);

    const membersMap = new Map();

    result.rows.forEach(row => {
      if (!membersMap.has(row.member_id)) {
        membersMap.set(row.member_id, {
          member_id: row.member_id,
          full_name: row.full_name,
          contribution_amt: row.contribution_amt,
          installmentDetails: []
        });
      }
      if (row.installment_date && row.installment_amt) {
        membersMap.get(row.member_id).installmentDetails.push({
          installment_date: row.installment_date,
          installment_amt: row.installment_amt
        });
      }
    });

    const members = Array.from(membersMap.values());
    res.json(members);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch members and installments' });
  }
});

app.post('/search-members', async (req, res) => {
  try {
    const searchQuery = req.body.search; // Get the search parameter from the request body    
    if (!searchQuery) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Query the database to find members whose full_name matches the search text
    const result = await pool.query(
      `SELECT member_id, full_name 
       FROM members 
       WHERE LOWER(full_name) LIKE LOWER($1) 
       ORDER BY full_name 
       LIMIT 10`,
      [`%${searchQuery}%`] // Use a wildcard search
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error searching members:', err);
    res.status(500).json({ error: 'Failed to search members' });
  }
});

// POST API to insert member and installment details
app.post('/add-member', async (req, res) => {
    const { full_name, phone, contribution_amt, installment_amt } = req.body;
  
    try {
      // Start a transaction to ensure both operations are successful
      await pool.query('BEGIN');
  
      // Insert the member into the 'members' table
      const memberInsertQuery = `
        INSERT INTO members (full_name, phone, contribution_amt)
        VALUES ($1, $2, $3)
        RETURNING member_id;
      `;
      const memberResult = await pool.query(memberInsertQuery, [full_name, phone, contribution_amt]);
  
      // Get the member_id of the newly inserted member
      const member_id = memberResult.rows[0].member_id;
  
      // Insert the installment into the 'member_installments' table
      const installmentInsertQuery = `
        INSERT INTO member_installments (member_id, installment_date, installment_amt)
        VALUES ($1, CURRENT_DATE, $2);
      `;
      await pool.query(installmentInsertQuery, [member_id, installment_amt]);
  
      // Commit the transaction
      await pool.query('COMMIT');
  
      // Send response back with success message
      res.status(201).json({ message: 'Member and installment added successfully' });
  
    } catch (err) {
      // Rollback in case of error
      await pool.query('ROLLBACK');
      console.error(err);
      res.status(500).json({ error: 'Failed to add member and installment' });
    }
  });



  app.get('/all-members-names', async (req, res) => {
    try {
      const membersQuery = `SELECT full_name FROM members;`;
      
      const result = await pool.query(membersQuery);
      
      const memberNames = result.rows.map(row => row.full_name);
      // Ensure rows exist before returning
      if (memberNames.length === 0) {
        return res.status(404).json({ message: 'No members found' });
      }
  
      res.status(200).json(result.rows);  // Send only `rows`
    } catch (err) {
      console.error('Database Query Error:', err);
      res.status(500).json({ error: 'Failed to fetch member names' });
    }
  });
  