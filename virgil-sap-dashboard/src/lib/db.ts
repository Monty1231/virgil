import { Pool } from 'pg'

// const pool = new Pool({
//   user: 'vadmin', // replace with your actual username
//   host: process.env.DB_HOST,
//   database: 'virgilrds', // your actual DB name (you might want to lowercase and remove spaces)
//   password: process.env.DB_PASSWORD,
//   port: 5432,
//   ssl: {
//     rejectUnauthorized: false, // only for development
//   },
// })

// export default pool

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
  },
})
export default pool