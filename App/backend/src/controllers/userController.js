// Example user controller functions
export const getUsers = (req, res) => {
  res.json([{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }]);
};

export const createUser = (req, res) => {
  const { name, email } = req.body;
  // Here you’d insert into DB
  res.status(201).json({ message: "User created", user: { name, email } });
};

export const loginUser = (req, res) => {
  const { email, password } = req.body;
  // Example login check (replace with real auth)
  if (email === "test@example.com" && password === "password") {
    res.json({ message: "Login successful", token: "fake-jwt-token" });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
};
