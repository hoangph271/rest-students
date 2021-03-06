const express = require('express')
const bodyParser = require('express')
const cors = require('cors')
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

const isValidStudent = ({ name, age, level }) => {
  if (typeof name !== 'string') {
    return { error: '`name` must be a string' }
  }
  if (name.length === 0) {
    return { error: '`name` must be a NOT empty string' }
  }
  if (!(_.isInteger(age))) {
    return { error: '`age` must be an integer' }
  }
  if (age < 0) {
    return { error: '`age` must NOT be negative' }
  }
  if (typeof level !== 'string') {
    return { error: '`level` must be a string' }
  }

  return { ok: true }
}
const isValidTodo = ({ title, done }) => {
  if (typeof title !== 'string') {
    return { error: '`title` must be a string' }
  }
  if (title.length === 0) {
    return { error: '`title` must be a NOT empty string' }
  }
  if (typeof done !== 'boolean') {
    return { error: '`done` must be a boolean' }
  }

  return { ok: true }
}

;(async () => {
  const app = express()
  const db = await connectDb()

  app.use(cors())

  app.get('/todos', async (_, res) => {
    const todos = await db.collection('todos')
      .find()
      .toArray()

    res.send(todos)
  })
  app.get('/todos/:_id', async (req, res) => {
    const _id = new ObjectId(req.params._id)

    const todo = await db.collection('todos')
      .findOne({ _id })

    if (_.isNil(todo)) {
      res.sendStatus(404)
      return
    }

    res.send(todo)
  })
  app.post('/todos', bodyParser.json(), async (req, res) => {
    const todo = req.body

    const { error } = isValidTodo(todo)

    if (error) {
      res.sendStatus(400).send(error)
      return
    }

    const { insertedId } = await db.collection('todos')
      .insertOne(todo)

    res.send({ _id: insertedId })
  })
  app.put('/todos/:_id', bodyParser.json(), async (req, res) => {
    const todo = req.body

    const { error } = isValidTodo(todo)

    if (error) {
      res.sendStatus(400).send(error)
      return
    }

    const _id = new ObjectId(req.params._id)

    const { matchedCount, result } = await db.collection('todos')
      .updateOne({ _id }, { $set: todo })

    if (matchedCount === 0) {
      res.sendStatus(404)
    }

    return result.ok
      ? res.sendStatus(200)
      : res.sendStatus(500)
  })

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

    const { error } = isValidStudent(student)

    if (error) {
      res.sendStatus(400).send(error)
      return
    }

    const { insertedId } = await db.collection('students')
      .insertOne(student)

    res.send({ _id: insertedId })
  })
  app.put('/student/:_id', bodyParser.json(), async (req, res) => {
    const student = req.body

    const { error } = isValidStudent(student)

    if (error) {
      res.sendStatus(400).send(error)
      return
    }

    const _id = new ObjectId(req.params._id)

    const { matchedCount, result } = await db.collection('students')
      .updateOne({ _id }, { $set: student })

    if (matchedCount === 0) {
      res.sendStatus(404)
    }

    return result.ok
      ? res.sendStatus(200)
      : res.sendStatus(500)
  })
  app.delete('/student/:_id', async (req, res) => {
    const _id = new ObjectId(req.params._id)

    const { result, deletedCount } = await db.collection('students')
      .deleteOne({ _id })

    if (result.ok) {
      deletedCount
        ? res.sendStatus(200)
        : res.sendStatus(404)
      return
    }

    res.sendStatus(500)
  })

  app.get('*', (_, res) => res.sendStatus(404))

  app.use((error, _, res) => {
    console.error(error)

    res
      .status(500)
      .send('Something broke!')
  })

  app.listen(PORT, () => {
    console.info(`Server started@${PORT}...!`)
  })
})()
