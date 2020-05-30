const mongoose = require('mongoose');
const dotenv  = require('dotenv');

process.on('uncaughtException', err => {
  console.log(err);
  console.log('UNCAUGHT EXCEPTION! shutting down....');
  process.exit(1);
});

dotenv.config({path: './config.env'});
const app = require('./app');
const DB =((process.env.NODE_ENV === 'development')? process.env.DATABASE_LOCAL:
  process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD));


mongoose.connect(DB, {
  useNewUrlParser:true,
  useCreateIndex: true,
  useFindAndModify:false
}).then(con => console.log('DB connection successfully'));



// const testTour = new Tour({
//   name:'The Park Camper',
//   price:997
// });
//
// testTour.save().then(doc =>console.log(doc))
//   .catch(err =>console.log(`ERROR :${err}`));

const port = process.env.PORT || 3000;
// const port = 6000;
const server = app.listen(port, ()=>{
	console.log(`App running on port ${port}.....`);
});

process.on('unhandleRejection', err => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION! shutting down....');
  server.close(() => { process.exit(1); });
});
