import { Pool } from 'pg'

const pool = new Pool({
  user: 'admin',
  host: process.env.DB_HOST,
  database: 'postgres',
  password: process.env.DB_PASSWORD,
  port: 5432,
})

export default pool
