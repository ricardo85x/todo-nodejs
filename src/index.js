const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers

  const userExists = users.find(u => u.username === username)

  if (!userExists) {
    return response.status(400).json({ error: "User not authenticated" })
  }
  request.username = username
  return next()
}

function checkExistingTodo(request, response, next) {
  const { id } = request.params
  const { username } = request
  const user = users.find(u => u.username === username)

  const todoIndex = user.todos.findIndex(t => t.id === id)

  if(todoIndex === -1) {
    return response.status(404).json({ error: "Todo could not be found" })
  }

  request.current_todo = user.todos[todoIndex]

  return next()

}


app.post('/users', (request, response) => {
  const { name, username } = request.body

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: []
  }

  const userUsernameTaken = users.find(u => u.username === username)

  if (userUsernameTaken) {
    return response.status(400).json({ error: "username already taken" })
  }

  users.push(user)

  return response.status(201).json(user)

});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { username } = request

  const user = users.find(u => u.username === username)

  return response.json(user.todos)
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body
  const { username } = request

  const user = users.find(u => u.username === username)

  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline:  new Date(deadline),
    created_at: new Date()
  }
  user.todos.push(todo)

  return response.status(201).json(todo)
});

app.put('/todos/:id', checksExistsUserAccount, checkExistingTodo, (request, response) => {
  
  const { current_todo } = request
  const { title, deadline } = request.body
  current_todo.title = title, 
  current_todo.deadline = new Date(deadline)
  return response.status(201).json(current_todo)
});

app.patch('/todos/:id/done', checksExistsUserAccount, checkExistingTodo, (request, response) => {
  const { current_todo } = request
  current_todo.done = true
  return response.status(201).json(current_todo)
});

app.delete('/todos/:id', checksExistsUserAccount, checkExistingTodo, (request, response) => {
  const { username } = request
  const { id } = request.params
  const user = users.find(u => u.username === username)
  user.todos = user.todos.filter(t => t.id !== id)
  return response.status(204).json(user.todos)
});

module.exports = app;