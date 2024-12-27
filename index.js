import express from "express";
import axios from "axios";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const API_SEARCH_URL = "https://openlibrary.org/search.json?q=";
const API_FIELDS =
  "&fields=isbn,title,author_name,first_publish_year,number_of_pages_median,subject";
const API_IMAGE_URL = "https://covers.openlibrary.org/b/isbn/";
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "my_library",
  password: process.env.PASSWORD,
  port: 5432,
});
db.connect((err) => {
  if (err) {
    console.error("Connection Error", err);
  } else {
    console.log("Connected to database");
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("./public"));

let sort = "created_at";

app.get("/", async (_, res) => {
  const result = await db.query(`SELECT * FROM shelf ORDER BY ${sort} DESC`);
  return res
    .status(200)
    .render("index.ejs", { books: result.rows, API_IMAGE_URL, sort });
});
app.get("/sort/:sort", (req, res) => {
  sort = req.params.sort.replace(/-/g, " ");
  return res.status(200).redirect("/");
});

app.get("/add/:isbn/:bookName/:author", (req, res) =>
  res.status(200).render("add.ejs", {
    isbn: req.params.isbn,
    bookName: req.params.bookName,
    author: req.params.author,
    API_IMAGE_URL,
  })
);
app.get("/edit/:id", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM shelf WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rowCount === 0) {
      const error = new Error("Can't Find the Book");
      error.code = 404;
      throw error;
    }

    return res.status(200).render("edit.ejs", {
      id: result.rows[0].id,
      isbn: result.rows[0].isbn,
      author: result.rows[0].book_author,
      bookName: result.rows[0].book_title,
      review: result.rows[0].review,
      rating: result.rows[0].rating,
      API_IMAGE_URL,
    });
  } catch (error) {
    console.error("Error: ", error);
    let code = error.code < 500 ? error.code : 500;
    return res
      .status(code)
      .render("error.ejs", { errorMessage: code + " " + error.message });
  }
});
app.get("/book/:id", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM shelf WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rowCount === 0) {
      const error = new Error("Can't Find the Book");
      error.code = 404;
      throw error;
    }

    return res
      .status(200)
      .render("book.ejs", { book: result.rows[0], API_IMAGE_URL });
  } catch (error) {
    console.error("Error: ", error);
    let code = error.code < 500 ? error.code : 500;
    return res
      .status(code)
      .render("error.ejs", { errorMessage: code + " " + error.message });
  }
});
app.get("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      const error = new Error("Missing Record ID");
      error.code = 400;
      throw error;
    }

    await db.query("DELETE FROM shelf WHERE id = $1", [id]);

    return res.status(200).redirect("/");
  } catch (error) {
    console.error("Error: ", error);
    let code = error.code < 500 ? error.code : 500;
    return res
      .status(code)
      .render("error.ejs", { errorMessage: code + " " + error.message });
  }
});

app.post("/add-book", async (req, res) => {
  try {
    const { isbn, review, rating } = req.body;
    if (!isbn || !review || !rating) {
      const error = new Error("Missing Data");
      error.code = 400;
      throw error;
    }

    const result = await axios.get(API_SEARCH_URL + isbn + API_FIELDS);
    const book = result.data.docs[0];

    await db.query(
      "INSERT INTO shelf (isbn,book_title,book_author,publish_year,pages,subject,review,rating) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
      [
        book.isbn[0],
        book.title,
        book.author_name[0],
        book.first_publish_year,
        book.number_of_pages_median || 0,
        JSON.stringify(book.subject),
        review,
        rating,
      ]
    );

    return res.status(200).redirect("/");
  } catch (error) {
    console.error("Error: ", error);
    let code = error.code < 500 ? error.code : 500;
    return res
      .status(code)
      .render("error.ejs", { errorMessage: code + " " + error.message });
  }
});
app.post("/edit-book", async (req, res) => {
  try {
    const { id, review, rating } = req.body;
    if (!id || !review || !rating) {
      const error = new Error("Missing Data");
      error.code = 400;
      throw error;
    }

    await db.query("UPDATE shelf SET review = $1,rating = $2 WHERE id = $3", [
      review,
      rating,
      id,
    ]);

    return res.status(200).redirect("/");
  } catch (error) {
    console.error("Error: ", error);
    let code = error.code < 500 ? error.code : 500;
    return res
      .status(code)
      .render("error.ejs", { errorMessage: code + " " + error.message });
  }
});

app.get("/*", (_, res) =>
  res.status(404).render("error.ejs", { errorMessage: "404 Page Not Found" })
);
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
