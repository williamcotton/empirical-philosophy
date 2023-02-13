import sqlite3 from 'sqlite3';

// Connect to the database or create it if it doesn't exist
export const db = new sqlite3.Database('./solved-problems.db', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the problems database.');
});

export async function insertData(data) {
  // Insert data into the table
  db.run(`INSERT INTO solved_problems (question, answer, grade_level, category, operation, solved_prompt, solved_augmented_prompt, solved_res, solved_question, solved_description, solved_thunk, solved_answer, correct)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      data.problem.question,
      data.problem.answer,
      data.problem.grade_level,
      data.problem.category,
      data.problem.operation || '',
      data.solvedProblem.prompt,
      data.solvedProblem.augmentedPrompt,
      JSON.stringify(data.solvedProblem.res),
      data.solvedProblem.question || data.problem.question,
      JSON.stringify(data.solvedProblem.description ? data.solvedProblem.description : []),
      data.solvedProblem.thunk || '',
      data.solvedProblem.answer || '',
      data.correct ? 1 : 0
    ], function(err) {
      if (err) {
        return console.log(err.message);
      }
      console.log(`Data has been successfully inserted into the database`);
    });
}

export // Create a table to store the data
const createTableSql = `
CREATE TABLE IF NOT EXISTS solved_problems (
  question TEXT NOT NULL,
  answer REAL NOT NULL,
  grade_level TEXT NOT NULL,
  category TEXT NOT NULL,
  operation TEXT NOT NULL,
  solved_prompt TEXT NOT NULL,
  solved_augmented_prompt TEXT NOT NULL,
  solved_res TEXT NOT NULL,
  solved_question TEXT NOT NULL,
  solved_description TEXT NOT NULL,
  solved_thunk TEXT NOT NULL,
  solved_answer REAL NOT NULL,
  correct INTEGER NOT NULL
);
`;

db.run(createTableSql, (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Table created successfully.');
});

export function closeDb() {
  db.close((err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Close the database connection.');
  });
}

