const express = require('express');
const app = express();
const cors = require('cors');
// const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000;
// middleware
const corsOptions ={
  origin:'*', 
  credentials:true,
  optionSuccessStatus:200,
}
app.use(cors(corsOptions));
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
var uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@ac-ytdlcug-shard-00-00.lvcap8y.mongodb.net:27017,ac-ytdlcug-shard-00-01.lvcap8y.mongodb.net:27017,ac-ytdlcug-shard-00-02.lvcap8y.mongodb.net:27017/?ssl=true&replicaSet=atlas-j6c9nb-shard-0&authSource=admin&retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  async function run() {
    try {

         // await client.connect();
    // Send a ping to confirm a successful connection

    const usersCollection = client.db("jumpDb").collection("users");
    const productsCollection = client.db("jumpDb").collection("addproducts");
    app.post('/users',async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exists' })
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
    app.get('/users', async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });
  //  all project
    // app.post('/addproduct', verifyJWT, async (req, res) => {
    app.post('/addproducts', async (req, res) => {
      const newItem = req.body;
      const result = await productsCollection.insertOne(newItem)
      res.send(result);
    })
    app.get('/addproducts',  async (req, res) => {
      const result = await productsCollection.find().toArray();
      res.send(result);
    });
    // womens fashion
 app.get('/womensfashion/:text', async (req, res) => {
      console.log(req.params.text);
      if (req.params.text == 'womensfashion' ) {
        const result = await productsCollection.find({ category: req.params.text }).toArray();
        console.log(result);
        return res.send(result);
      }
      const result = await productsCollection.find({}).toArray();
      res.send(result)
    })


    console.log("Pinged your deployment. You successfully connected to MongoDB!");
} finally {
  // Ensures that the client will close when you finish/error
  // await client.close();
}
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('project running')
  })
  app.listen(port, () => {
    console.log(`programmer girl sitting on port ${port}`);
  })