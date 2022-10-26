import type { NextApiHandler } from 'next'
import clientPromise from '../../lib/mongo'

const question: NextApiHandler = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).end()

  try {
    const client = await clientPromise
    const db = client.db('choiceofdev')

    const ip = req.socket.remoteAddress ?? req.headers['x-forwarded-for']
    if (!ip) return res.status(400).end()

    const givenAnswers = await db.collection('answers').findOne({ ip }, { projection: { answers: 1 } })
    const answeredSlugs = givenAnswers?.answers ?? {}

    const unansweredQuestions = await db
      .collection('questions')
      .find({ slug: { $nin: Object.keys(answeredSlugs) } })
      .limit(20)
      .toArray()

    if (unansweredQuestions.length === 0) {
      const anyQuestions = await db.collection('questions').find({}).limit(20).toArray()
      return res.json(anyQuestions)
    }

    res.json(unansweredQuestions)
  } catch (e) {
    console.error(e)
    res.status(500).end()
  }
}

export default question
