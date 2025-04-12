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

// create constants for tests
const validUser = { userName: 'yellowleopard753', password: 'jonjon' };
const user = users.find((u) => u.login.username === validUser.userName);
const invalidUsers = [
  { userName: 123, password: 456 },
  { userName: '', password: '' },
  { userName: 'valid', password: 456 },
  { userName: 123, password: 'valid' },
  { userName: '', password: 'valid' },
  { userName: 'valid', password: '' },
  { userName: 'valid' },
  { password: 'valid' },
  {},
];
const incorrectUsers = [
  {
    userName: 'yellowleopard753',
    password: 'incorrectPassword',
  },
  {
    userName: 'incorrectUsername',
    password: 'jonjon',
  },
  {
    userName: 'incorrectUsername',
    password: 'incorrectPassword',
  },
];

const validToken = jwt.sign({ userName: validUser.userName }, SECRET_KEY, {
  expiresIn: '1 day',
});
const invalidToken = jwt.sign({ userName: validUser.userName }, 'invalid key', {
  expiresIn: '1 day',
});

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

const testCasesCart403 = [{}, invalidToken];

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
    invalidUsers.forEach((testUser) => {
      it('should respond with 400 status if an invalid user object is supplied in request body', (done) => {
        chai
          .request(server)
          .post('/login')
          .send(testUser)
          .end((err, res) => {
            res.should.have.status(400);
            done();
          });
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

    incorrectUsers.forEach((testUser) => {
      it('should return a 401 error if an incorect username and/or password is supplied in request', (done) => {
        chai
          .request(server)
          .post('/login')
          .send(testUser)
          .end((err, res) => {
            res.should.have.status(401);
            done();
          });
      });
    });

    it('should return 200 if a valid username and password are supplied in request', (done) => {
      chai
        .request(server)
        .post('/login')
        .send(validUser)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    it('should respond with a jwt if correct username and password supplied in request', (done) => {
      chai
        .request(server)
        .post('/login')
        .send(validUser)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('string');

          const decoded = jwt.decode(res.body);
          decoded.should.have.property('userName').equal(validUser.userName);
          decoded.should.have.property('exp');
          done();
        });
    });
  });
});

describe('validateRequestToken', () => {
  it('should return an object with valid prop equal to true and a decoded prop if request contains a valid jwt', () => {
    const request = {
      headers: {
        authorization: `Bearer ${validToken}`,
      },
    };
    const response = validateRequestToken(request);
    response.valid.should.be.true;
    response.should.have.own.property('decoded');
  });

  it('should return an object with valid prop equal to false and an error prop if request contains an invalid jwt or no jwt', () => {
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
  describe('/GET me/cart', () => {
    testCasesCart403.forEach((testCase) => {
      it('should respond with 403 when no token provided or token is invalid', (done) => {
        chai
          .request(server)
          .get('/me/cart')
          .send(testCase)
          .end((err, res) => {
            res.should.have.status(403);
            done();
          });
      });
    });

    it('should respond with 200 and return the cart if valid token is supplied', (done) => {
      chai
        .request(server)
        .get('/me/cart')
        .set('Authorization', `Bearer ${validToken}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.deep.equal(user.cart);
          done();
        });
    });
  });

  describe('/POST me/cart', () => {
    beforeEach(() => {
      user.cart = [];
    });

    testCasesCart403.forEach((testCase) => {
      it('should respond with 403 when no token provided or token is invalid', (done) => {
        chai
          .request(server)
          .post('/me/cart')
          .send(testCase)
          .end((err, res) => {
            res.should.have.status(403);
            done();
          });
      });
    });

    it('should respond with 400 when no product is supplied', (done) => {
      chai
        .request(server)
        .post('/me/cart')
        .set('Authorization', `Bearer ${validToken}`)
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
        .set('Authorization', `Bearer ${validToken}`)
        .send(invalidProduct)
        .end((err, res) => {
          res.should.have.status(400);
          done();
        });
    });

    it("should respond with 201, add product to given users cart and return the user's cart", (done) => {
      chai
        .request(server)
        .post('/me/cart')
        .set('Authorization', `Bearer ${validToken}`)
        .send(validProduct)
        .end((err, res) => {
          res.should.have.status(201);
          user.cart[0].should.deep.equal(cartProduct);
          res.body.should.deep.equal(user.cart);
          done();
        });
    });
    it('should increment the quantity of the supplied product when the product already exists in the cart', (done) => {
      user.cart = [cartProduct];

      chai
        .request(server)
        .post('/me/cart')
        .set('Authorization', `Bearer ${validToken}`)
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

    testCasesCart403.forEach((testCase) => {
      it('should respond with 403 when no token provided or token is invalid', (done) => {
        const productId = 2;

        chai
          .request(server)
          .put(`/me/cart/${productId}`)
          .send(testCase)
          .end((err, res) => {
            res.should.have.status(403);
            done();
          });
      });
    });

    it('should respond with 400 when provided product id does not exist', (done) => {
      const productId = 12;

      chai
        .request(server)
        .put(`/me/cart/${productId}`)
        .set('Authorization', `Bearer ${validToken}`)
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
        .set('Authorization', `Bearer ${validToken}`)
        .end((err, res) => {
          res.should.have.status(404);
          done();
        });
    });

    it("should respond with 201, update corresponding product quantity, and return the user's cart", (done) => {
      const productId = 2;
      const newQuantity = { quantity: 4 };
      user.cart = [validProduct];

      chai
        .request(server)
        .put(`/me/cart/${productId}`)
        .set('Authorization', `Bearer ${validToken}`)
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
    beforeEach(() => {
      user.cart = [];
    });

    testCasesCart403.forEach((testCase) => {
      it('should respond with 403 when no token provided or token is invalid', (done) => {
        const productId = 2;

        chai
          .request(server)
          .delete(`/me/cart/${productId}`)
          .send(testCase)
          .end((err, res) => {
            res.should.have.status(403);
            done();
          });
      });
    });

    it('should respond with 400 when provided product id does not exist', (done) => {
      const productId = 12;

      chai
        .request(server)
        .delete(`/me/cart/${productId}`)
        .set('Authorization', `Bearer ${validToken}`)
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
        .set('Authorization', `Bearer ${validToken}`)
        .end((err, res) => {
          res.should.have.status(404);
          done();
        });
    });

    it("should respond with 200, remove corresponding product from user's cart and return the user's cart", (done) => {
      const productId = 2;
      user.cart = [validProduct];

      chai
        .request(server)
        .delete(`/me/cart/${productId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .end((err, res) => {
          res.should.have.status(200);
          user.cart.should.not.include(validProduct);
          res.body.should.deep.equal(user.cart);
          done();
        });
    });
  });
});
