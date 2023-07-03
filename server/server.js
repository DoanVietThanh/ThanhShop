const express = require('express');
const dbConnect = require('./config/dbConnect');
const initRoutes = require('./routes');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
app.use(cookieParser());
const port = process.env.PORT || 8888;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
dbConnect();
initRoutes(app);
// app.use('/', (req, res) => {
//   res.send('Server ONNN');
// });

app.listen(port, () => {
  console.log('Server running at port: ' + port);
});
