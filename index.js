const express = require('express')
const cors = require('cors')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.MDB_user}:${process.env.MDB_pass}@cluster0.8wqrrau.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    const usersCollection = client.db('TouristGuide').collection('users')
    const addpackageCollection = client.db('TouristGuide').collection('addpackage')
    const addWishlistCollection = client.db('TouristGuide').collection('wishlist')


    // Save or modify user email, status in DB
    app.put('/users/:email', async (req, res) => {
      const email = req.params.email
      const user = req.body
      console.log(user);
      const query = { email: email }
      const options = { upsert: true }
      const isExist = await usersCollection.findOne(query)
      console.log('User found?----->', isExist)
      if (isExist) {
        if (user?.status === 'Requested') {
          const result = await usersCollection.updateOne(
            query,
            {
              $set: user,
            },
            options
          )
          return res.send(result)
        } else {
          return res.send(isExist)
        }
      }
      const result = await usersCollection.updateOne(
        query,
        {
          $set: { ...user, timestamp: Date.now() },
        },
        options
      )
      res.send(result)
    })
    // Get user role params
    app.get('/users/:email', async (req, res) => {
      const email = req.params.email
      const result = await usersCollection.findOne({ email })
      res.send(result)
    })
    // Get all users
    app.get('/users', async (req, res) => {
      const result = await usersCollection.find().toArray()
      res.send(result)
    })
    // wishlist
    app.post('/wishlist', async (req, res) => {
      const addwishlist = req.body;
      const result = await addWishlistCollection.insertOne(addwishlist);
      res.send(result);
    })
    // Get all wishlist
    app.get('/wishlist', async (req, res) => {
      const result = await addWishlistCollection.find().toArray()
      res.send(result)
    })
    // Get wishlist params
    app.get('/wishlist/:email', async (req, res) => {
      const email = req.params.email;
      const fiter = { email: email }
      const result = await addWishlistCollection.find(fiter).toArray()
      res.send(result)
    })

    // add package add admin
    app.post('/addpackage', async (req, res) => {
      const addpackage = req.body;
      const result = await addpackageCollection.insertOne(addpackage);
      res.send(result);
    })
    // Get  package
    app.get('/addpackage', async (req, res) => {
      const result = await addpackageCollection.find().toArray()
      res.send(result)
    })
    // Get single package
    app.get('/addpackage/:id', async (req, res) => {
      const id = req.params.id;
      const result = await addpackageCollection.findOne({ _id: new ObjectId(id) })
      res.send(result)
    })
    //--------------------------------------------------
    app.get('/tourtypebtdata/:idd', async (req, res) => {
      const id = req.params.idd;
      const alltype = await addpackageCollection.findOne({ _id: new ObjectId(id) });
      // Fetch related products based on the relationships defined in your database
      const relatedType = await addpackageCollection.find({ tourType: alltype.tourType }).toArray();

      res.json({ alltype, relatedType });

    })
 

    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})