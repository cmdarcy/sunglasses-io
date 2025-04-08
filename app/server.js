const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml'); // Replace './swagger.yaml' with the path to your Swagger file
const app = express();
require('dotenv').config()
const SECRET_KEY = process.env.SECRET_KEY

app.use(bodyParser.json());

// Importing the data from JSON files
const users = require('../initial-data/users.json');
const brands = require('../initial-data/brands.json');
const products = require('../initial-data/products.json');

const validateRequestToken = (request) => {
	const authHeader = request.headers['authorization']
	if (!authHeader) {
		return {valid: false , error: 'Auth header not provided'} 
	}
	const token = authHeader.split(' ')[1]
	if (!token) {
		return {valid: false,  error: 'Header not formatted correctly'} 
	}
	try {
		const decoded = jwt.verify(token, SECRET_KEY)
		return {valid: true, decoded}
	} catch (error) {
		return {valid: false, error: error.message}
	}
}

// Error handling
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).send('Something broke!');
});

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Starting the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

app.get('/brands', (req, res) => {
	res.writeHead(200, 'Successful operation', { "Content-Type": "application/json" })
	return res.end(JSON.stringify(brands))
})

app.get('/brands/:brandId/products', (req, res) => {
	const {brandId} = req.params
	const brand = brands.find((b) => b.id === brandId)
	if (!brand) {
		res.writeHead(404, 'Brand does not exist')
		return res.end()
	}
	const brandProducts = products.filter((p) => p.categoryId === brandId)
	if (brandProducts.length === 0) {
		res.writeHead(404, 'No products for given brand exist')
		return res.end()
	}
	res.writeHead(200, 'Successful operation', { "Content-Type": "application/json" })
	return res.end(JSON.stringify(brandProducts))
})

app.get('/products', (req, res) => {
	if (req.query.searchTerm) {
		//filter products by searchTerm compared to product name
		const filteredProducts = products.filter((p) =>p.name.includes(req.query.searchTerm))
		if (filteredProducts.length > 0) {
			//if filter returns product lis greater than 0 return that list of products with a 200
			res.writeHead(200, 'Successful operation', { "Content-Type": "application/json" })
			return res.end(JSON.stringify(filteredProducts))
		} else {
			//else return 404
			res.writeHead(404, 'No products found',)
			return res.end()
		}
	} else {
		res.writeHead(200, 'Successful operation', { "Content-Type": "application/json" })
		return res.end(JSON.stringify(products))
	}
})

app.post('/login', (req, res) => {
	const {userName, password} = req.body
	//check if userName or passWord were undefined
	if (!userName || !password) {
		res.writeHead(400, 'Username/password not supplied')
		return res.end()
	}
	//check if userName or passWord are not strings
	if (typeof userName !== 'string' || typeof password !== 'string') {
		res.writeHead(400, 'Invalid username/password')
		return res.end()
	}
	//check if userName or passWord are empty strings
	if (userName.length <= 0 || password.length <= 0) {
		res.writeHead(400, 'Invalid username/password')
		return res.end()
	}
	//
	const user = users.find((u) => u.login.username === userName && u.login.password === password)
	//check if user exists with given username and password
	if (!user) {
		res.writeHead(401, 'Incorrect username/password supplied')
		return res.end()
	}
	res.writeHead(200, 'Successful operation', {"Content-Type": "application/json"})
	const newToken = jwt.sign({userName: user.login.username}, SECRET_KEY, {expiresIn: '1 day'})
	return res.end(JSON.stringify(newToken))
})

app.get('/me/cart', (req, res) => {
	const response = validateRequestToken(req)
	if (!response.valid) {
		res.writeHead(403)
		return res.end()
	}
	const {userName} = response.decoded
	const user = users.find(u => u.login.username === userName)
	const cart = user.cart
	res.writeHead(200, 'Successful operation', { "Content-Type": "application/json" })
	return res.end(JSON.stringify(cart))
})
module.exports = app;
module.exports.validateRequestToken = validateRequestToken
