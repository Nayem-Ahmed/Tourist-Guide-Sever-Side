const express = require('express')
const cors = require('cors')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

app.use(cors({
  origin: ['http://localhost:5173', 'https://tourist-guide-e5f20.web.app', 'https://tourist-guide-e5f20.firebaseapp.com'],
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
    const addBookingCollection = client.db('TouristGuide').collection('booking')


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
    // update user from dashboard
    app.patch('/updateProfile/:email', async (req, res) => {
      try {
        const email = req.params.email;
        const updatedProfile = req.body; 

        // Find the user in the database based on the email
        const query = { email: email };
        const user = await usersCollection.findOne(query);

        if (!user) {
          return res.status(404).send({ message: 'User not found' });
        }

        // Update the user's profile with the provided data
        const result = await usersCollection.updateOne(query, { $set: updatedProfile });

        if (result.modifiedCount === 0) {
          return res.status(400).send({ message: 'Failed to update user profile' });
        }

        // Send the updated user profile in the response
        res.send({ message: 'User profile updated successfully', user: updatedProfile });
      } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).send({ message: 'Internal server error' });
      }
    })
    // Get all users
    app.get('/users', async (req, res) => {
      const result = await usersCollection.find().toArray()
      res.send(result)
    })
    // wishlist post
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
    // Get single wishlist
    app.get('/wishlist/id/:id', async (req, res) => {
      const id = req.params.id
      const result = await addWishlistCollection.findOne({ _id: new ObjectId(id) })
      res.send(result)
    })
    // Get wishlist params
    app.get('/wishlist/:email', async (req, res) => {
      const email = req.params.email;
      const fiter = { email: email }
      const result = await addWishlistCollection.find(fiter).toArray();
      res.send(result)
    })
    // wishlist delete
    app.delete('/wishlist/:id', async (req, res) => {
      const id = req.params.id
      const finddeletewish = await addWishlistCollection.deleteOne({ _id: new ObjectId(id) })
      res.send(finddeletewish)
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
    // related data load
    app.get('/tourtypebtdata/:idd', async (req, res) => {
      const id = req.params.idd;
      const alltype = await addpackageCollection.findOne({ _id: new ObjectId(id) });
      // Fetch related products based on the relationships defined in your database
      const relatedType = await addpackageCollection.find({ tourType: alltype.tourType }).toArray();

      res.json({ alltype, relatedType });

    })
    // BOOKING post
    app.post('/booking', async (req, res) => {
      const addbook = req.body;
      const result = await addBookingCollection.insertOne(addbook);
      res.send(result);
    })
    // Get all booking
    app.get('/booking', async (req, res) => {
      const result = await addBookingCollection.find().toArray()
      res.send(result)
    })
    //change role REJECTED
    app.patch('/booking/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          status: "rejected",
        },
      }
      const result = await addBookingCollection.updateOne(filter, updateDoc)
      res.send(result)

    })
    //change role ACCEPTED
    app.patch('/booking/id/:id', async (req, res) => {
      const id = req.params.id;
      const filter2 = { _id: new ObjectId(id) }
      const updateDocData = {
        $set: {
          status: "accepted",
        },
      }
      const result = await addBookingCollection.updateOne(filter2, updateDocData)
      res.send(result)

    })

    // Get BOOKING params
    app.get('/booking/:email', async (req, res) => {
      const email = req.params.email;
      const fiterrr = { email: email }
      const result = await addBookingCollection.find(fiterrr).toArray();
      res.send(result)
    })
    // single BOOKING delete
    app.delete('/booking/:id', async (req, res) => {
      const id = req.params.id
      const finddelete = await addBookingCollection.deleteOne({ _id: new ObjectId(id) })
      res.send(finddelete)
    })



    // await client.connect();
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