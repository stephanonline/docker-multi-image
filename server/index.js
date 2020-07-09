const keys = require('./keys');
const express = require('express');
const bodyParser = requie('body-parser');
const cors = require('cors');
const pg = require('pg');

var redisClient = redis.createClient({ 
    host: keys.redisHost, 
    port: keys.redisPort, 
    retry_strategy: () => 1000 
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

const { Pool } = require('pg');
const pgClient = new Pool({
    host: keys.pgHost,
    port: keys.pgPort,
    user: keys.pgUser,
    password: keys.pgPassword,
    database: keys.pgDatabase
});

pgClient.on('error', () => console.log('Lost PG Connection'));

pgClient.query('CREATE TABLE IF NOT EXISTS values (number INT)')
    .catch((err) => console.log(err));


var redisClient = redis.createClient({ 
    host: keys.redisHost, 
    port: keys.redisPort, 
    retry_strategy: () => 1000 
});

const redisPublisher = redisClient.duplicate();


app.get('/', (req, res) => res.send('Hi'));

app.get('/values/all', async (req, res) => {
    const values = await pgClient.query('SELECT * FROM values');

    res.send(values.rows);
});

app.get('/values/current', async (req, res) => {
    redisClient.htgetall('values', (err, values) => {
        res.send(values);
    });
})

app.post('/values', async (req, res) => {
    const index = req.body.index;

    if (parseInt(index) > 40)
    return res.status(422).send('Index too high');

    redisClient.hset('values', index, 'Nothing yet');
    redisPublisher.publish('indx', index);
    pgClient.query('INSERT INTO values(number) VALUES ($1)', [index])
})

const PORT_NUMBER = 5000;
app.listen(PORT_NUMBER, () => console.log(`Listening on port ${PORT_NUMBER}`))