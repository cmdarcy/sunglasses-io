const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app/server'); // Adjust the path as needed
const jwt = require('jsonwebtoken');
require('dotenv').config()
const SECRET_KEY = process.env.SECRET_KEY
const validateRequestToken = require('../app/server').validateRequestToken

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
            const testJwt = jwt.sign({userName: user.userName}, SECRET_KEY, {expiresIn: '1 day'})
            chai.request(server).post('/login').send(user).end((err, res) => {
                res.should.have.status(200)
                res.body.should.deep.equal(testJwt)
                done()
            })
        })
     })
});

describe('validateRequestToken', () => {
    //TODO refactor setup???
    const userName = 'yellowleopard753'
    const token = jwt.sign({userName}, SECRET_KEY, {expiresIn: '1 day'})
    const request = {
        headers: {
            'authorization': `Bearer ${token}`
        }
    }
    it('should return an object with valid prop equal to true and a decoded prop if request contains a valid jwt', () => {
        const response = validateRequestToken(request) 
        response.valid.should.be.true
        response.should.have.own.property('decoded')
    })
    const invalidToken = jwt.sign({userName}, 'invalid_key', {expiresIn: '1 day'})
    const invalidRequest = {
        headers: {
            'authorization': `Bearer ${invalidToken}`
        }
    }
    it('should return an object with valid prop equal to false and an error prop if request contains an invalid jwt or no jwt', () => {
        const response = validateRequestToken(invalidRequest) 
        response.valid.should.be.false
        response.should.have.own.property('error')
    })
})

describe('Cart', () => {
    const userName = 'yellowleopard753'
    const token = jwt.sign({userName}, SECRET_KEY, {expiresIn: '1 day'})
    describe('/GET me/cart', () => { 
        it('should respond with 403 if no token provided or token is invalid', (done) => {
            //TODO finish testing logic
            chai.request(server).get('/me/cart').end((err, res) => {
                res.should.have.status(403)
                done()
            })
        })
        it('should respond with 200 and return the cart if valid token is supplied', (done) => {
            //TODO finish testing logic
            chai.request(server).get('/me/cart').set('Authorization', `Bearer ${token}`).end((err, res) => {
                res.should.have.status(200)
                res.body.should.be.an('array')
                done()
            })
        })
     })
    describe('/POST me/cart', () => { 

     })
    describe('/PUT me/cart/:productId', () => { 

     })
    describe('/DELETE me/cart/:productId', () => { 

     })
});
