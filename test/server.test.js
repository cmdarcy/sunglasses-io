const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app/server'); // Adjust the path as needed
const jwt = require('jsonwebtoken');
const tokens = require('../app/server').tokens
require('dotenv').config()
const SECRET_KEY = process.env.SECRET_KEY

const should = chai.should();
chai.use(chaiHttp);

// TODO: Write tests for the server

describe('Brands', () => {
    describe('/GET brands', () => { 
        it('should get all the brands', (done) => {
            chai.request(server).get('/brands').end((err, res) => {
                res.should.have.status(200)
                res.body.should.be.an('array')
                res.body.length.should.be.eql(5)
                done()
            })
        })
    })
    describe('/GET brands/:brandId/products', () => { 
        it('should return 404 if the supplied brand does not exist or no products for that brand exist', (done) => {
            const brandId = '6'
            chai.request(server).get(`/brands/${brandId}/products`).end((err, res) => {
                res.should.have.status(404)
                done()
            })
        })
        
        it('should get all the prouducts of one specific brand when a valid brandId is supplied', (done) => {
            const brandId = '2'
            chai.request(server).get(`/brands/${brandId}/products`).end((err, res) => {
                res.should.have.status(200)
                res.body.should.be.an('array')
                res.body.length.should.be.eql(2)
                done()
            })
        })
        
        
    })
});

describe('Products', () => {
    describe('/GET products', () => { 
        it('should get all the products when no search query is present', (done) => {
            chai.request(server).get('/products').end((err, res) => {
                res.should.have.status(200)
                res.body.should.be.an('array')
                res.body.length.should.be.eql(11)
                done()
            })
        })
        it('should return a 404 error if no products contain search query', (done) => {
            const searchTerm = 'blue'
            chai.request(server).get(`/products?searchTerm=${searchTerm}`).end((err, res) => {
                res.should.have.status(404)
                done()
            })
        })
        it('should return a filtered list of products based on search query otherwise', (done) => {
            const searchTerm = 'glasses'
            chai.request(server).get(`/products?searchTerm=${searchTerm}`).end((err, res) => {
                res.should.have.status(200)
                res.body.should.be.an('array')
                done()
            })
        })
        
     })
});

describe('Login', () => {
    describe('/POST login', () => { 
        it('should return a 400 error if an invalid userName or password is supplied in request', (done) => {
            const invalidUser = {userName: '', password: 567}
            chai.request(server).post('/login').send(invalidUser).end((err, res) => {
                res.should.have.status(400)
                done()
            })
        })
        it('should return a 401 error if an incorect username or password is supplied in request', (done) => {
            const incorrectUser = {userName:'yellowleopard753', password: 'incorrectPW' }
            chai.request(server).post('/login').send(incorrectUser).end((err, res) => {
                res.should.have.status(401)
                done()
            })
        })
        const user = {userName: 'yellowleopard753', password: 'jonjon'}
        it('should return 200 if a valid username and password are supplied in request', (done) => {
            chai.request(server).post('/login').send(user).end((err, res) => {
                res.should.have.status(200)
                done()
            })
        })
        it('should respond with a new jwt if no current access token existed for user', (done) => {
            const testJwt = jwt.sign({userName: user.userName}, SECRET_KEY)
            chai.request(server).post('/login').send(user).end((err, res) => {
                res.should.have.status(200)
                res.body.should.deep.equal(testJwt)
                done()
            })
        })
        it('should respond with the current jwt for user if one already exists', (done) => {
            const currentToken = tokens.find((t) => t.userName === user.userName)
            chai.request(server).post('/login').send(user).end((err, res) => {
                res.should.have.status(200)
                res.body.should.deep.equal(currentToken.jwt)
                done()
            })
        })
     })
});

describe('Cart', () => {
    describe('/GET me/cart', () => { 
        
     })
    describe('/POST me/cart', () => { 

     })
    describe('/PUT me/cart/:productId', () => { 

     })
    describe('/DELETE me/cart/:productId', () => { 

     })
});
