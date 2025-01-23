const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

// Create an express app
const app = express();
app.use(cors());
app.use(express.json()); // To parse JSON bodies

// PostgreSQL pool setup
const pool = new Pool({
  user: 'postgres', // PostgreSQL username
  host: 'localhost',
  database: 'jayantidb',
  password: 'root',
  port: 5432,
});
// // Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


// Basic Route
// app.get('/', (req, res) => {
//   res.send('Hello from Node.js');
// });

// CRUD Routes
// Create a record
// app.post('/create', async (req, res) => {
//   const { name, age } = req.body;
//   const result = await pool.query(
//     'INSERT INTO users (name, age) VALUES ($1, $2) RETURNING *',
//     [name, age]
//   );
//   res.json(result.rows[0]);
// });

// Read records
app.get('/employees', async (req, res) => {
  const result = await pool.query('SELECT * FROM employees');
  res.json(result.rows);
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

  
// Update a record
// app.put('/update/:id', async (req, res) => {
//   const { id } = req.params;
//   const { name, age } = req.body;
//   const result = await pool.query(
//     'UPDATE users SET name = $1, age = $2 WHERE id = $3 RETURNING *',
//     [name, age, id]
//   );
//   res.json(result.rows[0]);
// });

// // Delete a record
// app.delete('/delete/:id', async (req, res) => {
//   const { id } = req.params;
//   const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
//   res.json({ message: 'User deleted' });
// });


