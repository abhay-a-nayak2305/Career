const dotenv = require('dotenv')
const path = require('path')

// Load environment variables from .dev.vars
dotenv.config({ path: path.join(__dirname, '../.dev.vars') })

// Now run the actual seeder
require('./seed.js')
