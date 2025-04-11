const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');
const server = require('../app/server'); // Adjust the path as needed
require('dotenv').config();

const { SECRET_KEY } = process.env;
const { validateRequestToken } = require('../app/server');
const { users } = require('../app/server');

const should = chai.should();
chai.use(chaiHttp);

// TODO: Write tests for the server

describe('Brands', () => {
  describe('/GET brands', () => {
    it('should get all the brands', (done) => {
      chai
        .request(server)
        .get('/brands')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an('array');
          res.body.should.not.be.empty;
          res.body[0].should.have.all.keys('id', 'name');
          done();
        });
    });
  });

  describe('/GET brands/:brandId/products', () => {
    it('should respond with 404 status when the supplied brand does not exist', (done) => {
      const brandId = '7';

      chai
        .request(server)
        .get(`/brands/${brandId}/products`)
        .end((err, res) => {
          res.should.have.status(404);
          done();
        });
    });

    it('should respond with 200 status and return an empty array when no products for that brand exist', (done) => {
      const brandId = '6';

      chai
        .request(server)
        .get(`/brands/${brandId}/products`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an('array');
          res.body.should.be.empty;
          done();
        });
    });

    it('should get all the products of one specific brand when a valid brandId is supplied', (done) => {
      const brandId = '2';

      chai
        .request(server)
        .get(`/brands/${brandId}/products`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an('array');
          res.body.length.should.be.eql(2);
          done();
        });
    });
  });
});

describe('Products', () => {
  describe('/GET products', () => {
    it('should get all the products when no search query is present', (done) => {
      chai
        .request(server)
        .get('/products')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an('array');
          res.body.should.not.be.empty;
          res.body[0].should.have.all.keys(
            'id',
            'categoryId',
            'name',
            'description',
            'price',
            'imageUrls',
          );
          done();
        });
    });

    it('should treat an empty searchTerm the same as not supplying one', (done) => {
      const searchTerm = '';

      chai
        .request(server)
        .get(`/products?searchTerm=${searchTerm}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an('array');
          res.body.should.not.be.empty;
          res.body[0].should.have.all.keys(
            'id',
            'categoryId',
            'name',
            'description',
            'price',
            'imageUrls',
          );
          done();
        });
    });

    it('should respond with 200 and return an empty array if no products match search query', (done) => {
      const searchTerm = 'blue';

      chai
        .request(server)
        .get(`/products?searchTerm=${searchTerm}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an('array');
          res.body.should.be.empty;
          done();
        });
    });

    it('should return a filtered list of products based on search query otherwise', (done) => {
      const searchTerm = 'glasses';

      chai
        .request(server)
        .get(`/products?searchTerm=${searchTerm}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an('array');
          res.body.should.not.be.empty;
          res.body[0].should.have.all.keys(
            'id',
            'categoryId',
            'name',
            'description',
            'price',
            'imageUrls',
          );
          done();
        });
    });
  });
});

describe('Login', () => {
  describe('/POST login', () => {
    it('should return a 400 error if an invalid userName or password is supplied in request', (done) => {
      const invalidUser = { userName: '', password: 567 };

      chai
        .request(server)
        .post('/login')
        .send(invalidUser)
        .end((err, res) => {
          res.should.have.status(400);
          done();
        });
    });

    it('should respond with a 400 status if no userName or password is supplied in request', (done) => {
      const missingUsername = { password: 567 };

      chai
        .request(server)
        .post('/login')
        .send(missingUsername)
        .end((err, res) => {
          res.should.have.status(400);
          done();
        });
    });

    it('should respond with a 400 status if empty body is sent with request', (done) => {
      chai
        .request(server)
        .post('/login')
        .end((err, res) => {
          res.should.have.status(400);
          done();
        });
    });

    it('should return a 401 error if an incorect username or password is supplied in request', (done) => {
      const incorrectUser = {
        userName: 'yellowleopard753',
        password: 'incorrectPW',
      };

      chai
        .request(server)
        .post('/login')
        .send(incorrectUser)
        .end((err, res) => {
          res.should.have.status(401);
          done();
        });
    });

    const user = { userName: 'yellowleopard753', password: 'jonjon' };
    it('should return 200 if a valid username and password are supplied in request', (done) => {
      chai
        .request(server)
        .post('/login')
        .send(user)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    it('should respond with a new jwt if no current access token existed for user', (done) => {
      const testJwt = jwt.sign({ userName: user.userName }, SECRET_KEY, {
        expiresIn: '1 day',
      });

      chai
        .request(server)
        .post('/login')
        .send(user)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.deep.equal(testJwt);
          done();
        });
    });
  });
});

describe('validateRequestToken', () => {
  const userName = 'yellowleopard753';

  it('should return an object with valid prop equal to true and a decoded prop if request contains a valid jwt', () => {
    const token = jwt.sign({ userName }, SECRET_KEY, { expiresIn: '1 day' });
    const request = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };
    const response = validateRequestToken(request);
    response.valid.should.be.true;
    response.should.have.own.property('decoded');
  });

  it('should return an object with valid prop equal to false and an error prop if request contains an invalid jwt or no jwt', () => {
    const invalidToken = jwt.sign({ userName }, 'invalid_key', {
      expiresIn: '1 day',
    });
    const invalidRequest = {
      headers: {
        authorization: `Bearer ${invalidToken}`,
      },
    };
    const response = validateRequestToken(invalidRequest);
    response.valid.should.be.false;
    response.should.have.own.property('error');
  });
});

describe('Cart', () => {
  const userName = 'yellowleopard753';
  const token = jwt.sign({ userName }, SECRET_KEY, { expiresIn: '1 day' });
  const user = users.find((u) => u.login.username === userName);

  describe('/GET me/cart', () => {
    it('should respond with 403 if no token provided or token is invalid', (done) => {
      chai
        .request(server)
        .get('/me/cart')
        .end((err, res) => {
          res.should.have.status(403);
          done();
        });
    });

    it('should respond with 200 and return the cart if valid token is supplied', (done) => {
      chai
        .request(server)
        .get('/me/cart')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.deep.equal(user.cart);
          done();
        });
    });
  });

  describe('/POST me/cart', () => {
    it('should respond with 403 when no token provided or token is invalid', (done) => {
      chai
        .request(server)
        .post('/me/cart')
        .end((err, res) => {
          res.should.have.status(403);
          done();
        });
    });

    it('should respond with 400 when no product is supplied', (done) => {
      chai
        .request(server)
        .post('/me/cart')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(400);
          done();
        });
    });

    it('should respond with 400 when product supplied is invalid', (done) => {
      const invalidProduct = {
        id: 'INVALID_ID',
        categoryId: '1',
        name: 'Black Sunglasses',
        description: 'The best glasses in the world',
        price: 100,
        imageUrls: [
          'https://image.shutterstock.com/z/stock-photo-yellow-sunglasses-white-backgound-600820286.jpg',
          'https://image.shutterstock.com/z/stock-photo-yellow-sunglasses-white-backgound-600820286.jpg',
          'https://image.shutterstock.com/z/stock-photo-yellow-sunglasses-white-backgound-600820286.jpg',
        ],
      };

      chai
        .request(server)
        .post('/me/cart')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidProduct)
        .end((err, res) => {
          res.should.have.status(400);
          done();
        });
    });

    it("should respond with 201, add product to given users cart and return the user's cart", (done) => {
      const validProduct = {
        id: '2',
        categoryId: '1',
        name: 'Black Sunglasses',
        description: 'The best glasses in the world',
        price: 100,
        imageUrls: [
          'https://image.shutterstock.com/z/stock-photo-yellow-sunglasses-white-backgound-600820286.jpg',
          'https://image.shutterstock.com/z/stock-photo-yellow-sunglasses-white-backgound-600820286.jpg',
          'https://image.shutterstock.com/z/stock-photo-yellow-sunglasses-white-backgound-600820286.jpg',
        ],
      };
      const { imageUrls, description, ...rest } = validProduct;
      const cartProduct = { ...rest, quantity: 1 };

      chai
        .request(server)
        .post('/me/cart')
        .set('Authorization', `Bearer ${token}`)
        .send(validProduct)
        .end((err, res) => {
          res.should.have.status(201);
          user.cart[0].should.deep.equal(cartProduct);
          res.body.should.deep.equal(user.cart);
          done();
        });
    });
    it('should increment the quantity of the supplied product when the product already exists in the cart', (done) => {
      const validProduct = {
        id: '2',
        categoryId: '1',
        name: 'Black Sunglasses',
        description: 'The best glasses in the world',
        price: 100,
        imageUrls: [
          'https://image.shutterstock.com/z/stock-photo-yellow-sunglasses-white-backgound-600820286.jpg',
          'https://image.shutterstock.com/z/stock-photo-yellow-sunglasses-white-backgound-600820286.jpg',
          'https://image.shutterstock.com/z/stock-photo-yellow-sunglasses-white-backgound-600820286.jpg',
        ],
      };
      const { imageUrls, description, ...rest } = validProduct;
      const cartProduct = { ...rest, quantity: 1 };
      user.cart = [cartProduct];

      chai
        .request(server)
        .post('/me/cart')
        .set('Authorization', `Bearer ${token}`)
        .send(validProduct)
        .end((err, res) => {
          user.cart[0].quantity.should.equal(2);
          done();
        });
    });
  });

  describe('/PUT me/cart/:productId', () => {
    beforeEach(() => {
      user.cart = [];
    });

    it('should respond with 403 when no token provided or token is invalid', (done) => {
      const productId = 2;

      chai
        .request(server)
        .put(`/me/cart/${productId}`)
        .end((err, res) => {
          res.should.have.status(403);
          done();
        });
    });

    it('should respond with 400 when provided product id does not exist', (done) => {
      const productId = 12;

      chai
        .request(server)
        .put(`/me/cart/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(400);
          done();
        });
    });

    it('should respond with 404 when corresponding product does not exist in cart', (done) => {
      const productId = 2;

      chai
        .request(server)
        .put(`/me/cart/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(404);
          done();
        });
    });

    it("should respond with 201, update corresponding product quantity, and return the user's cart", (done) => {
      const testProduct = {
        id: '8',
        categoryId: '4',
        name: 'Coke cans',
        price: 110,
        quantity: 1,
      };
      const productId = 8;
      const newQuantity = { quantity: 4 };
      user.cart = [testProduct];

      chai
        .request(server)
        .put(`/me/cart/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(newQuantity)
        .end((err, res) => {
          res.should.have.status(201);
          user.cart[0].quantity.should.equal(newQuantity.quantity);
          res.body.should.deep.equal(user.cart);
          done();
        });
    });
  });

  describe('/DELETE me/cart/:productId', () => {
    it('should respond with 403 when no token provided or token is invalid', (done) => {
      const productId = 2;

      chai
        .request(server)
        .delete(`/me/cart/${productId}`)
        .end((err, res) => {
          res.should.have.status(403);
          done();
        });
    });

    it('should respond with 400 when provided product id does not exist', (done) => {
      const productId = 12;

      chai
        .request(server)
        .delete(`/me/cart/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(400);
          done();
        });
    });

    it('should respond with 404 when corresponding product does not exist in cart', (done) => {
      const productId = 2;

      chai
        .request(server)
        .delete(`/me/cart/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(404);
          done();
        });
    });

    it("should respond with 200, remove corresponding product from user's cart and return the user's cart", (done) => {
      const productId = 2;
      const testProduct = {
        id: '2',
        categoryId: '1',
        name: 'Black Sunglasses',
        price: 100,
        quantity: 2,
      };
      user.cart = [testProduct];

      chai
        .request(server)
        .delete(`/me/cart/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          user.cart.should.not.include(testProduct);
          res.body.should.deep.equal(user.cart);
          done();
        });
    });
  });
});
