const request = require('supertest')
const app = require('../src/app')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const User = require('../src/models/user')

const userOneID = new mongoose.Types.ObjectId()
const userOne = {
    _id : userOneID,
    name : 'Mike',
    email : 'mike@gmail.com',
    password : 'mike123!',
    tokens : [{
        token : jwt.sign({_id: userOneID},process.env.JWT_TOKEN)
    }]
}

beforeEach(async ()=>{
    await User.deleteMany()
    await new User(userOne).save()
})

test('Should signup a new user', async()=>{
    const response = await request(app).post('/users').send({
        name : 'Rock',
        email : 'rock@example.com',
        password : 'rock1234!'
    }).expect(201)

    //Assert that the db was updated correctly
    const user = await User.findById(response.body.user._id)
    expect(user).not.toBeNull()
})

test('Should login existing user', async()=>{
    await request(app).post('/users/login').send({
        email : userOne.email,
        password : userOne.password
    }).expect(200)
})

test('Should not login nonexsistent user', async()=>{
    await request(app).post('/users/login').send({
        email : 'wrongcredentials',
        password : 'wrongcredentials'
    }).expect(400)
})

test('Should get profile for user', async()=>{
    await request(app)
    .get('/users/me')
    .set('Authorization',`Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
})

test('Should not get profile for unauthenticated user', async()=>{
    await request(app)
    .get('/users/me')
    .send()
    .expect(401)
})

test('Should delete account for user', async()=>{
    await request(app)
    .delete('/users/me')
    .set('Authorization',`Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
})

test('Should not delete account for unauthenticated user', async()=>{
    await request(app)
    .delete('/users/me')
    .send()
    .expect(401)
})

test('Should update valid user fields', async()=>{
    await request(app)
    .patch('/users/me')
    .set('Authorization',`Bearer ${userOne.tokens[0].token}`)
    .send({
        name : 'Jim'
    })
    .expect(200)
    const user = await User.findById(userOneID)
    expect(user.name).toBe('Jim')
})

test('Should not update invalid user fields', async()=>{
    await request(app)
    .patch('/users/me')
    .set('Authorization',`Bearer ${userOne.tokens[0].token}`)
    .send({
        location : 'Newark'
    })
    .expect(400)
})