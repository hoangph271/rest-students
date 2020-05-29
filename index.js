const express = require('express')
const bodyParser = require('express')
const _ = require('lodash')
const { MongoClient, ObjectId, Db } = require('mongodb')

const { PORT = 8080 } = process.env

/**
 * @returns {Promise<Db>}
 */
const connectDb = () => new Promise((resolve, reject) => {
  const url = 'mongodb://db:NHrGr$DFdQD2NYL@ds135726.mlab.com:35726/rest-students-529'

  MongoClient.connect(url, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  }, (err, client) => {
    if (err) {
      reject(err)
      return
    }

    process.once('exit', () => client.close())

    const db = client.db('rest-students-529')

    resolve(db)
  })
})


;(async () => {
  const app = express()
  const db = await connectDb()

  app.get('/student', async (_, res) => {
    const students = await db.collection('students')
      .find()
      .toArray()

    res.send(students)
  })
  app.get('/student/:_id', async (req, res) => {
    const _id = new ObjectId(req.params._id)

    const student = await db.collection('students')
      .findOne({ _id })

    if (_.isNil(student)) {
      res.sendStatus(404)
      return
    }

    res.send(student)
  })
  app.post('/student', bodyParser.json(), async (req, res) => {
    const student = req.body

    const { name, age, level } = student

    if (typeof name !== 'string') {
      res.status(400).send('`name` must be a string')
      return
    }
    if (name.length === 0) {
      res.status(400).send('`name` must NOT be empty')
      return
    }
    if (!(_.isInteger(age))) {
      res.status(400).send('`age` must be an integer')
      return
    }
    if (age < 0) {
      res.status(400).send('`age` must NOT be negative')
      return
    }
    if (typeof level !== 'string') {
      res.status(400).send('`level` must be a string')
      return
    }

    const { insertedId } = await db.collection('students')
      .insertOne(student)

    res.send({ _id: insertedId })
  })

  app.get('*', (_, res) => res.sendStatus(404))

  app.listen(PORT, () => {
    console.info(`Server started@${PORT}...!`)
  })
})()
