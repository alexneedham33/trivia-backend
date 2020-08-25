let numQuestions;
let idArrayNorth = [];
let idArraySouth = [];
let idArrayCentral = [];
let idArrayPacific = [];
let idArrayGeneral = [];

let allArrays = [
  idArrayNorth,
  idArraySouth,
  idArrayCentral,
  idArrayPacific,
  idArrayGeneral,
];
let categories = ["North", "Central", "Southern", "Pacific", "General"];

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const sqlite = require("sqlite3");
const fs = require("fs");
const path = require("path");
const { createQuestionTable } = require("./sql");
const parse = require("csv-parse");
const db = new sqlite.Database("./newtrivia");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));

  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "https://alex-trivia.herokuapp.com");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    next();
  });
}

app.get("/", (req, res) => {
  res.send("api running");
});

app.get("/:cat", (req, res) => {
  //extracting chosen Category number
  let chosenCatNum = req.params.cat;
  console.log(chosenCatNum);
  chosenCatNum = parseInt(chosenCatNum);
  console.log(chosenCatNum);
  //Checking if it is a number
  console.log(typeof chosenCatNum);
  // Extracting the right array to update using the num
  console.log(allArrays[chosenCatNum]);
  let chosenCat = categories[chosenCatNum];
  console.log(chosenCat);

  function sql1(chosenCat) {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM que WHERE category=$chosenCat",
        {
          $chosenCat: chosenCat,
        },
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            if (allArrays[chosenCatNum].length === 0) {
              for (let i = 1; i <= 25; i++) {
                allArrays[chosenCatNum].push(i);
              }
            }
            let randomIndex = Math.floor(
              Math.random() * allArrays[chosenCatNum].length
            ); //wow!
            console.log(randomIndex);
            let randomId = allArrays[chosenCatNum][randomIndex];
            console.log(randomId);
            console.log(allArrays[chosenCatNum]);
            allArrays[chosenCatNum].splice(randomIndex, 1);
            // now scale the chosen 'randomId' based on the category chosen so it matches sql table range
            randomId = randomId + 25 * chosenCatNum;
            console.log(randomId);

            resolve(randomId);
          }
        }
      );
    });
  }

  function sql2(randomId) {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM que WHERE id=$randomId",
        {
          $randomId: randomId,
        },
        (err, row) => {
          if (err) {
            console.log("problem fetching question");
            reject(err);
          } else {
            //console.log(rows);
            console.log(row.title);
            res.send({
              title: row.title,
              answer1: row.answer1,
              answer2: row.answer2,
              answer3: row.answer3,
              answer4: row.answer4,
              correctanswer: row.correctanswer,
              category: row.category,
            });
            resolve(row);
            return;
          }
        }
      );
    });
  }

  sql1().then((res) => sql2(res));
});

if (process.env.NODE_ENV !== "production") {
  app.get("/*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/build", "index.html"));
  });
}

app.listen(port, () => {
  console.log(`Listening on port ${port}`);

  db.serialize(() => {
    db.run("DROP TABLE IF EXISTS que;", () => {
      console.log("dropping now");
    });

    db.run(createQuestionTable(), (err) => {
      if (err) {
        console.log("error picked up whilst creating");
      } else {
        console.log("no error picked up whilst creating");
        let idCounter = 1;
        fs.createReadStream("./data/triviaquestions.csv")
          .pipe(parse({ from: 2 }))
          .on("data", function (csvrow) {
            db.run(
              "INSERT INTO que (id, title, correctanswer, answer2, answer3, answer4, category) VALUES ($id, $title, $correctanswer, $answer2, $answer3, $answer4, $category)",
              {
                $id: idCounter,
                $title: csvrow[0],
                $correctanswer: csvrow[1],
                $answer2: csvrow[2],
                $answer3: csvrow[3],
                $answer4: csvrow[4],
                $category: csvrow[5],
              },
              (err) => {
                if (err) {
                  console.log("error while inserting question data");
                }
                return;
              }
            );
            idCounter++;
          });
      }
    });

    setTimeout(
      () =>
        db.all("SELECT * FROM que", [], (err, rows) => {
          if (err) {
            throw err;
          }
          numQuestions = rows.length;
          rows.forEach((row) => {
            console.log(row);
          });
        }),
      2000
    );
  });
});
