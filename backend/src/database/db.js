const mongoose = require('mongoose');

const dbConnection = async () => {
  await mongoose.connect(process.env.DB_URL)
    .then(() => console.log("Database connected"))
    .catch((err) => console.error(err));
};
module.exports = dbConnection;