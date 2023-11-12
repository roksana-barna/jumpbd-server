const express = require('express');
const cors = require('cors');
const multer = require('multer');
const app = express();
// const upload = multer({ dest: 'uploads/' });
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware
// const corsOptions = {
//   origin: '*',
//   credentials: true,
//   optionSuccessStatus: 200,
// }
// app.use(cors(corsOptions));
const corsConfig ={
  origin:'*',
  credentials:true,
  methods:['GET','POST','PUT','PATCH','DELETE']
}
app.use(cors(corsConfig))
app.options('',cors(corsConfig))

app.use(express.json());

// const upload = multer({ dest: 'uploads/' });


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
    const cartCollection = client.db('jumpDb').collection('addtocart')
    const orderCollection = client.db('jumpDb').collection('orders')

    app.use('/productImages', express.static('uploads'));


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
    app.post('/users', async (req, res) => {
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
    // app.post('/addproducts', async (req, res) => {
    //   const newItem = req.body;
    //   const result = await productsCollection.insertOne(newItem)
    //   res.send(result);
    // })

    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Destination folder for uploaded files
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = file.fieldname + '-' + uniqueSuffix + '-' + file.originalname
        req.uploadedFileName = filename;
        cb(null, filename);
      },
    });

    const upload = multer({ storage: storage });

    app.post('/addproducts', upload.single('productImages'), async (req, res) => {
      // const uploadedFiles = req.uploadedFileName;
      console.log(req.uploadedFileName)
      // if (!uploadedFiles) {
      //   return res.status(400).send('No files were uploaded.');
      // }
      // Access the uploaded files from req.files
      // const productImages = req.files.map((file) => file.path);

      // Access other form fields from req.body
      const newItem = {
        name: req.body.name,
        sellerName: req.body.sellerName,
        email: req.body.email,
        category: req.body.category,
        price: req.body.price,
        suggestprice: req.body.suggestprice,
        quantity: req.body.quantity,
        keyfeatures: req.body.keyfeatures,
        description: req.body.description,
        productImages: req.uploadedFileName, // Add the file paths to the newItem object
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

    // update quantity
    // app.post('/addproducts', upload.single('productImages'), async (req, res) => {
    //   const productId = req.body.productId; // Include a productId in the request body to identify the product
    //   const quantity = req.body.quantity; // Include quantity to update the product's quantity
    //   const uploadedFileName = req.uploadedFileName;
    
    //   // Access other form fields from req.body
    //   const newItem = {
    //     name: req.body.name,
    //     sellerName: req.body.sellerName,
    //     email: req.body.email,
    //     category: req.body.category,
    //     price: req.body.price,
    //     rating: req.body.rating,
    //     quantity: quantity, // Update the quantity based on the request
    //     keyfeatures: req.body.keyfeatures,
    //     description: req.body.description,
    //     productImages: uploadedFileName, // Add the file paths to the newItem object
    //   };
    
    //   try {
    //     if (productId) {
    //       // If a productId is provided, update the existing product
    //       const filter = { _id: new ObjectId(productId) };
    //       const updateDoc = {
    //         $set: newItem,
    //       };
    
    //       const result = await productsCollection.updateOne(filter, updateDoc);
    
    //       if (result.matchedCount === 0) {
    //         return res.status(404).json({ error: 'Product not found' });
    //       }
    
    //       return res.json({ message: 'Product updated successfully' });
    //     } else {
    //       // If no productId is provided, create a new product
    //       const result = await productsCollection.insertOne(newItem);
    //       return res.json({ message: 'Product created successfully', insertedId: result.insertedId });
    //     }
    //   } catch (error) {
    //     console.error('Error creating or updating product:', error);
    //     return res.status(500).json({ error: 'Failed to create or update the product' });
    //   }
    // });
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

    app.get('/subscriptions', async (req, res) => {
      const result = await subcriptionCollection.find().toArray();
      res.send(result);
    });
    // womens fashion
    app.get('/womensfashion/:text', async (req, res) => {
      console.log(req.params.text);
      if (req.params.text == 'womensfashion') {
        const result = await productsCollection.find({ category: req.params.text }).toArray();
        console.log(result);
        return res.send(result);
      }
      const result = await productsCollection.find({}).toArray();
      res.send(result)
    })
    // admin
    app.get('/users/admin/:email', verifyJWT, async (req, res) => {
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

    app.get('/users/seller/:email', verifyJWT, async (req, res) => {
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



    // profile
    app.get('/subscriptions/:email', async (req, res) => {
      const email=req.params.email;
      const query={ email :{ $eq:email}};
      console.log(email)
       const result = await subcriptionCollection.find(query).toArray()
       res.send(result);
     });
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


    // app.get('/cartitem/:orderId', (req, res) => {
//     app.get('/cartitem/:orderId', (req, res) => {
//   const orderId = parseInt(req.params.orderId);
//   const order = cartCollection.find((o) => o.id === orderId);

//   if (!order) {
//     return res.status(404).json({ error: 'Order not found' });
//   }

//   res.json(order);
// });
// update
app.get('/update/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const result = await subcriptionCollection.findOne(query);
  res.send(result)
})
app.put('/update/:id', async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) }
  const options = { upsert: true }
  const updatedtoy = req.body;
  const toy = {
    $set: {
      businessName: updatedtoy.businessName,
      nidNumber: updatedtoy.nidNumber,
      dateOfBirth: updatedtoy.dateOfBirth,
      address: updatedtoy.address,
      website: updatedtoy.website,
      businessPage: updatedtoy.businessPage,
      number: updatedtoy.number,
      email: updatedtoy.email,
      subscription_fee: updatedtoy.subscription_fee,
      nidFrontPart: updatedtoy.nidFrontPart,
      nidBackPart: updatedtoy.nidBackPart,
      photoURL:updatedtoy.photoURL,
    }
  }
  const result = await subcriptionCollection.updateOne(filter, toy, options);
  res.send(result)
})
  app.post('/cartitem', async (req, res) => {
    const newItem = req.body;
    const result = await cartCollection.insertOne(newItem)
    res.send(result);
  })
  app.get('/cartitem', async (req, res) => {
    const result = await cartCollection.find().toArray();
    res.send(result);
  });
 app.get('/cartitem/:email/:sortByPrice', async (req, res) => {
      const email = req.params.email;
      const sortByPrice = req.params.sortByPrice;
      const query = {email : email};
       const sort = { price:sortByPrice};
       console.log(email)
       console.log(sortByPrice)
         const cursor =  cartCollection.find(query).sort(sort).collation({locale: "en_US", numericOrdering: true}).limit(20);
      const result = await cursor.toArray();
      return res.send(result);
  })
 app.delete('/cartitem/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    })
    // /
    app.get('/carts', async (req, res) => {
      const email = req.query.email;

      if (!email) {
        res.send([]);
      }
      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });
  // app.get('/subscriptions/client/:email', async (req, res) => {
  //   const email = req.params.email;
  //   if (req.decoded.email !== email) {
  //     res.send({ client: false })
  //   }
  //   const query = { email: email }
  //   const user = await subcriptionCollection.findOne(query);
  //   const result = { client: user?.role === 'client' }
  //   res.send(result);
  // })

  // order
  // app.post('/orders', (req, res) => {
  //   const orderData = req.body;
  //   const order = {
  //     user: orderData.user,
  //     products: orderData.products,
  //     totalPrice: orderData.totalPrice,
  //     date: new Date().toISOString(),
  //   };
  //   orders.push(order);
  
  //   // Update product quantities based on the order
  //   for (const productId in order.products) {
  //     const product = products.find((p) => p.id === Number(productId));
  //     if (product) {
  //       product.quantity -= order.products[productId];
  //     }
  //   }
  
  //   res.json({ success: true });
  // });
  // app.post('/orders', async (req, res) => {
  //   const newItem = req.body;
  //   const result = await orderCollection.insertOne(newItem)
  //   res.send(result);
  // })

  // app.get('/orders', async (req, res) => {
  //   const email = req.query.email;

  //   if (!email) {
  //     res.send([]);
  //   }
  //   const query = { email: email };
  //   const result = await orderCollection.find(query).toArray();
  //   res.send(result);
  // });
  // order
  app.post('/orders', async (req, res) => {
    try {
      const newItem = req.body;
      const result = await orderCollection.insertOne(newItem);
      res.json({
        success: true,
        // order: result.ops[0],
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: 'Failed to create the order',
      });
    }
  });
  app.get('/orders', async (req, res) => {
    try {
      const orders = await orderCollection.find().toArray();
      res.json({
        success: true,
        orders: orders,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch orders',
      });
    }
  });
    
  // fullfilled
  app.put('/order/updateFulfillmentStatus/:orderId', async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    try {
        const result = await orderCollection.updateOne(
            { _id: ObjectId(orderId) },
            { $set: { fulfilled: status === 'fulfilled' } }
        );

        if (result.matchedCount === 1) {
            res.status(200).json({ success: true, message: 'Fulfillment status updated successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Order not found' });
        }
    } catch (error) {
        console.error('Error updating fulfillment status:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

  

  // allproducts for admin dashboard
  app.delete('/addproducts/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) }
    const result = await productsCollection.deleteOne(query);
    res.send(result);
  })
  app.get('/orderedproductdetails/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) }
    const result = await orderCollection.findOne(query);
    res.send(result)
  })

// Assuming you have a MongoDB collection for products
app.get('/updateproduct/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const result = await productsCollection.findOne(query);
  res.send(result)
});

app.put('/updateproduct/:id', async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) }
  const options = { upsert: true }
  const updatedProduct = req.body;
  const productUpdate = {
    $set: {
      category: updatedProduct.category,
      description: updatedProduct.description,
      email: updatedProduct.email,
      keyfeatures: updatedProduct.keyfeatures,
      name: updatedProduct.name,
      price: updatedProduct.price,
      suggestprice: updatedProduct.suggestprice,

      productImages: updatedProduct.productImages,
      quantity: updatedProduct.quantity,
    }
  }
  const result = await productsCollection.updateOne(filter, productUpdate, options);
  res.send(result)
});


  // searching
  const indexKeys = { name: 1 };
  const indexOptions = { name: 'toyName' };
  const result = await productsCollection.createIndex(indexKeys, indexOptions);
  console.log(result);

  app.get("/productNameSearch/:text", async (req, res) => {
    const text = req.params.text;
    // console.log(text)
    const result = await productsCollection
      .find({
        $or: [
          { name: { $regex: text, $options: "i" } },
        ],
      })
      .toArray();
    res.send(result);
  });
  
  console.log("Pinged your deployment. You successfully connected to MongoDB!");
} 
finally {
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
