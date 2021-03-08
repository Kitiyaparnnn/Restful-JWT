const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");

app.use(bodyParser.json());
const saltRound = 10;
const jwtSecret = "mysecret";

app.get("/", (req, res) => {
  res.send("api is running.");
});

app.get("/users", (req, res) => {
  // const users = fs.readFileSync("./user.json",{encoding: "utf-8"})
  const { users } = JSON.parse(
    fs.readFileSync("./user.json", { encoding: "utf-8" })
  );
  res.json(users);
});

//Add new user
app.post("/users", (req, res) => {
  //input new user
  const { username, password } = req.body;
  const file = JSON.parse(
    fs.readFileSync("./user.json", { encoding: "utf-8" })
  );
  const { users } = file;
  const existUser = users.find((user) => user.username === username);
  if (!existUser) {
    //add new user
    let lastPersonId = 0;
    if (users.length > 0) {
      lastPersonId = users[users.length - 1].id;
    }
    const encrytedPassword = bcrypt.hashSync(password, saltRound);
    const newUser = {
      id: lastPersonId + 1,
      username, //same name
      password: encrytedPassword, //same name
    };
    users.push(newUser);
    fs.writeFileSync("./user.json", JSON.stringify(file));
    res.json(newUser);
  } else {
    res.json({ massage: "User existed." });
  }
});

//Delete user by id
app.delete("/users/:userId", (req, res) => {
  const { userId } = req.params;
  const file = JSON.parse(
    fs.readFileSync("./user.json", { encoding: "utf-8" })
  );
  const { users } = file;
  file.users = users.filter((user) => user.id !== +userId);
  if (users.length === 0) {
    res.json({ massage: "No user." });
  } else {
    fs.writeFileSync("./user.json", JSON.stringify(file));
    res.json({ massage: "Delete complete" });
  }
  console.log(users);
  res.end();
});

//login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const { users } = JSON.parse(
    fs.readFileSync("./user.json", { encoding: "utf-8" })
  );
  const complete = users.find(
    (user) =>
      user.username === username && bcrypt.compareSync(password, user.password)
  );
  if (complete) {
    const token = jwt.sign(
      { id: complete.id, username: complete.username },
      jwtSecret
    );
    res.json({
      massage: "Login success.",
      token,
    });
  } else {
    res.json({ massage: "Login fail." });
  }
  console.log(complete);
  res.end();
});

//get user
app.get("/users/me", (req, res) => {
  const token = req.headers.authorization;
  if (token) {
    //validate token...
    try {
      const user = jwt.verify(token, jwtSecret);
      res.json(user);
      console.log(user);
    } catch (error) {
      res.json({ massage: "Invalid token" });
    }
  } else {
    res.json({ message: "missing token" });
  }
});

//run port at localhost
const port = process.env.PORT || 8000;
app.listen(port, () => console.log("Server is starting."));
