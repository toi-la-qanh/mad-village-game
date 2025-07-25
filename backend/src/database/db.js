const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const dbConnection = async () => {
  await mongoose.connect(process.env.DB_URL)
    .then(() => console.log("Database connected"))
    .catch((err) => console.error(err));
};
module.exports = dbConnection;