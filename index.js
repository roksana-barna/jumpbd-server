const express = require('express');
const multer = require('multer');
const app = express();
const upload = multer({ dest: 'uploads/' });
const cors = require('cors');
const jwt = require('jsonwebtoken');
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

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  // bearer token use
  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}

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
    const subcriptionCollection = client.db("jumpDb").collection("subscriptions");

    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1hr' })
      res.send({ token })
    })

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      if (user?.role !== 'admin') {
        return res.status(403).send({ error: true, message: 'porbidden message' });
      }
      next();
    }
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
    app.get('/users',async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });
  //  all project
    // app.post('/addproduct', verifyJWT, async (req, res) => {
    // app.post('/addproducts', async (req, res) => {
    //   const newItem = req.body;
    //   const result = await productsCollection.insertOne(newItem)
    //   res.send(result);
    // })

    app.post('/addproducts', upload.array('productImages', 5), async (req, res) => {
      // Access the uploaded files from req.files
      const productImages = req.files.map((file) => file.path);
    
      // Access other form fields from req.body
      const newItem = {
        name: req.body.name,
        sellerName: req.body.sellerName,
        email: req.body.email,
        category: req.body.category,
        price: req.body.price,
        rating: req.body.rating,
        quantity: req.body.quantity,
        keyfeatures: req.body.keyfeatures,
        description: req.body.description,
        productImages: productImages, // Add the file paths to the newItem object
      };
    
      try {
        // Handle the insertion of the newItem into your database
        const result = await productsCollection.insertOne(newItem);
    
        // Send a response to the client
        res.json({ message: 'Product successfully added', insertedId: result.insertedId });
      } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ error: 'Failed to add the product' });
      }
    });

    app.post('/subscriptions', async (req, res) => {
      const newItem = req.body;
      const result = await subcriptionCollection.insertOne(newItem)
      res.send(result);
    })
    // app.get('/addproducts',  async (req, res) => {
    //   const result = await productsCollection.find().toArray();
    //   res.send(result);
    // });

    app.get('/addproducts', async (req, res) => {
      try {
        const products = await productsCollection.find().toArray();
        res.json(products);
      } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
      }
    });
    
    app.get('/subscriptions',  async (req, res) => {
      const result = await subcriptionCollection.find().toArray();
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
// admin
    app.get('/users/admin/:email',verifyJWT, async (req, res) => {
      const email = req.params.email;
      if (req?.decoded?.email !== email) {
        res.send({ admin: false })
      }
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === 'admin' }
      res.send(result);
    })
    // role
    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    })

    app.get('/users/seller/:email',verifyJWT, async (req, res) => {
      const email = req.params.email;
      if (req.decoded.email !== email) {
        res.send({ seller: false })
      }
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      const result = { seller: user?.role === 'seller' }
      res.send(result);
    })
    app.patch('/users/seller/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'seller'
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    })
    // subscription
    app.patch('/subscriptions/client/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'client'
        },
      };
      const result = await subcriptionCollection.updateOne(filter, updateDoc);
      res.send(result);
    })
    app.patch('/subscriptions/denied/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'denied'
        },
      };
      const result = await subcriptionCollection.updateOne(filter, updateDoc);
      res.send(result);
    })
    // add to cart
    app.get('/addtocart/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await productsCollection.findOne(query);
      res.send(result)
    })

    app.get('/subscriptions/client/:email',verifyJWT, async (req, res) => {
      const email = req.params.email;
      if (req.decoded.email !== email) {
        res.send({ client: false })
      }
      const query = { email: email }
      const user = await subcriptionCollection.findOne(query);
      const result = { client: user?.role === 'client' }
      res.send(result);
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
  