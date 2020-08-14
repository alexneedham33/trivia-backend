

const createQuestionTable = () => {
  const query = `CREATE TABLE "que" (
    "id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
    "title"	TEXT NOT NULL,
    "correctanswer" TEXT NOT NULL,
    "answer2" TEXT NOT NULL,
    "answer3" TEXT NOT NULL,
    "answer4" TEXT NOT NULL,
    "category" TEXT NOT NULL
  );`
  return query;
};



module.exports = {
  createQuestionTable
}