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
      const payload = {
        ...user._doc,
        date: data.date,
        duration: data.duration,
        description: data.description,
      }
      delete payload.__v;
      return res.status(200).json(payload);
    })
  });
});


app.get('/api/users/:_id/logs', async (req, res) => {
  User.findById(req.params._id,
    function(err, user) {
      Exercise.find( {username: user.username }, function (err, exercises) {
        if(req.query.from) {
          const start = new Date(req.query.from).valueOf()
          exercises = exercises.filter( i => {
            const exerciseStart = new Date(i.date).valueOf();
            return exerciseStart >= start
          })
        }
        if(req.query.to) {
          const end = new Date(req.query.to).valueOf()
          exercises = exercises.filter( i => {
            return new Date(i.date).valueOf() <= end
          })
        }
        if(req.query.limit) {
          exercises = exercises.filter( (i,idx) => {
            return idx < req.query.limit
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
