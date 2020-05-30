const fs = require('fs');
const mongoose = require('mongoose');
const dotenv  = require('dotenv');
const Tour = require('./../models/tourModel');
dotenv.config({path: './config.env'});

const DB =((process.env.NODE_ENV === 'development')? process.env.DATABASE_LOCAL:
  process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD));


mongoose.connect(DB, {
  useNewUrlParser:true,
  useCreateIndex: true,
  useFindAndModify:false
}).then(con =>console.log('DB connection successfully'));

const tours= JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8'));
const importData = async () => {
  try {
    await Tour.create(tours);
    console.log('Data successfully loaded!');
    process.exit();
  } catch (err) {
    console.log(err);
  }
}

const deleteData = async () => {
  try{
    await Tour.deleteMany();
    console.log('Data successfully deleted!');
    process.exit();
  } catch (err){
    console.log(err);
  }
};
// node data/importData.js --delete or --import
if(process.argv[2] === '--import') importData();
else if (process.argv[2] === '--delete') deleteData();
