const app = require('./app'); // assuming app.js is in the same directory as server.js

const port = process.argv[2] || 3000; // get port number from command line or default to 3000

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

