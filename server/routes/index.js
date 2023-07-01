const { notFound, errorHandler } = require('../middleware/errorHandler');
const userRouter = require('./userRouter');
const initRoutes = (app) => {
  app.use('/api/user', userRouter);
  app.use(notFound);
  app.use(errorHandler);
};

module.exports = initRoutes;
