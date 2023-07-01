const { default: mongoose } = require('mongoose');
const dbConnect = async () => {
  try {
    const con = await mongoose.connect(process.env.MONGOOSE_URL);
    if (con.connection.readyState === 1) {
      console.log('DB connect successfully');
    } else {
      console.log('DB connecting');
    }
  } catch (error) {
    console.log('DB connection is failed');
    throw new Error(error);
  }
};
module.exports = dbConnect;
