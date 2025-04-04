const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app/server'); // Adjust the path as needed

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
