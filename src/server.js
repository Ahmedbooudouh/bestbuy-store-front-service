const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.static("public"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`store-front is running on port ${PORT}`);
});