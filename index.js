const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
let mongoose = require('mongoose');
const bodyParser = require("body-parser");
const User = require('./models/User');
const Exercise = require('./models/Exercise');

const uri = `mongodb+srv://robdll:${process.env.MONGO_URI}@cluster0.hxgwi4j.mongodb.net/exercise-tracker?retryWrites=true&w=majority`;

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());

app.use(cors())
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post('/api/users', async (req, res) => {
  console.log(req.body.username)
  const user = await User.create({ 
    username: req.body.username 
  });
  res.status(201).json(user);
});


app.get('/api/users', async (req, res) => {
  const users = await User.find({});
  res.status(200).json(users);
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  if(!req.body.description || !req.body.duration ) {
    return res.status(400).json({
      error: 'missing body values'
    });
  }
  const date = req.body.date ? new Date(req.body.date) : new Date();
  User.findById(req.params._id,
  function(err, user) {
    const exercise = new Exercise({
      description: req.body.description,
      duration: req.body.duration,
      username: user.username,
      date: date.toDateString()
    });
    exercise.save( function (err, data) {
      return res.status(200).json(exercise);
    })
  });
});


app.get('/api/users/:_id/logs', async (req, res) => {
  User.findById(req.params._id,
    function(err, user) {
      console.log(user)
      Exercise.find( {}, function (err, exercises) {
        if(req.query.from) {
          const start = new Date(req.query.from).valueOf()
          exercise = exercise.filter( i => {
            return new Date(i.date).valueOf >= start
          })
        }
        if(req.query.to) {
          const end = new Date(req.query.to).valueOf()
          exercise = exercise.filter( i => {
            return new Date(i.date).valueOf <= end
          })
        }
        if(req.query.limit) {
          exercise = exercise.filter( (i,idx) => {
            return idx <= req.query.limit
          })
        }
        const payload = {
          username: user.username,
          _id: user._id,
          count: exercises.length,
          log: exercises.map( item => ({
            description: item.description,
            duration: item.duration,
            date: item.date,
          }))
        }
        return res.status(200).json(payload);
      })
    }
  );
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
