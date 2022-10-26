import type { NextApiHandler } from 'next'
import clientPromise from '../../lib/mongo'

const answer: NextApiHandler = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { slug, answer } = JSON.parse(req.body)

    const client = await clientPromise
    const db = client.db('choiceofdev')

    const ip = req.socket.remoteAddress ?? req.headers['x-forwarded-for']
    if (!ip) return res.status(400).end()

    if (answer !== 1 && answer !== 2) return res.status(400).end()

    const foundQuestion = await db.collection('questions').findOne({ slug })
    if (foundQuestion === null) return res.status(400).end()

    const { acknowledged } = await db
      .collection('answers')
      .updateOne({ ip }, { $set: { [`answers.${slug}`]: answer } }, { upsert: true })

    if (!acknowledged) return res.status(500).end()

    // console.log({ ip, slug, answer, foundQuestion, acknowledged })

    res.status(200).end()
  } catch (e) {
    console.error(e)
    res.status(500).end()
  }
}

export default answer
