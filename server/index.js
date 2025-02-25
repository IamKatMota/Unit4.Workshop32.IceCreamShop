//imports here for express and pg
const express = require('express');
const app = express();
const pg = require('pg');
const path = require('path');
const client = new pg.Client('postgres://kat:Kat1234@localhost:5432/acme_ice_cream')

//static routes 
app.use(express.static(path.join(__dirname, '..client/dist'))) //middleware to bring any frontend like css,javascript,react
app.use(express.json()); // Middleware that allows express to read and process JSON data sent in the request body

//api routes

//async function bc we are connecting to the database
app.get('/api/flavors', async (req,res,next)=> {
    try {
        const SQL = `
            SELECT * FROM flavors
        `;
        const response = await client.query(SQL);
        res.send(response.rows); //sends the data of all objects in the array
    } catch (err) {
        next(err) //call middleware to process the error
    }
    
})
app.get('/api/flavors/:id', async (req,res,next)=> {
    const {id} = req.params; //get the id from url
    try {
        const SQL = `
        SELECT * FROM flavors WHERE id = $1 
        `//query to fetch flavor by id [in this case vanilla]
        const response = await client.query(SQL, [id]) //execute query with id parameter
        res.send(response.rows[0]) //send flavor details, since theres only one flavor in that array for that specific id we use [0]
    } catch (err) {
        next(err);
    }
})
//create a new flavor
app.post('/api/flavors', async(req,res,next)=> {
    const {name} = req.body //extract user input
    try {
        const SQL=`
            INSERT INTO flavors (name)
            VALUES ($1)
            RETURNING *
        `
        const response = await client.query(SQL, [name])
        res.send(response.rows[0]) //send back updated flavor
    } catch (error) {
        next(error);
    }
})
//delete a flavor
app.delete('/api/flavors/:id', async(req,res,next) => {
    const {id} = req.params;
    try {
        const SQL = `
            DELETE FROM flavors
            WHERE id = $1
            RETURNING *
        `
        const response = await client.query(SQL, [id])
        res.sendStatus(204) //no content resposne to show delete was successful
    } catch (error) {
        next(error)
    }
})

//update a flavor
app.put('/api/flavors/:id', async(req,res,next)=>{
    const {name} = req.body
    const {id} = req.params
    try {
        const SQL = `
        UPDATE flavors
        SET name = $1
        WHERE id = $2
        RETURNING *
        `
        const response = await client.query(SQL, [name, id])
        res.send(response.rows[0])
    } catch (error) {
        next(error)
    }
})

//init function that seeds the database

const init =  async() => {
    await client.connect(); //connect to database
    const SQL = `
        DROP TABLE IF EXISTS flavors;
        CREATE TABLE flavors(
            id SERIAL PRIMARY KEY,
            name VARCHAR(50)    ,
            is_favorite BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now()
        );
        INSERT INTO flavors (name) VALUES('vanilla'), ('chocolate'), ('strawberry');
    `

    await client.query(SQL);
    console.log('data seeded');

    app.listen(3000, () => console.log('Listening on port 3000'))
}

init();
