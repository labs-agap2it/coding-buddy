import * as path from "path";
import * as sqlite3 from "sqlite3";

class HashDatabase {
  private DB_PATH: string;
  private connection: sqlite3.Database;
  constructor() {
    this.DB_PATH = path.join(__dirname, "hashdb.sqlite");
    this.connection = new sqlite3.Database(this.DB_PATH, (err) => {
      if (err) {
        console.error("Error conecting to the database:", err.message);
      }
    });
  }

  close() {
    this.connection.close((err) => {
      if (err) {
        console.error("Error closing the database:", err.message);
      }
    });
  }

  run(query: string, params?: any[]) {
    this.connection.run(query, params, (err) => {
      if (err) {
        console.error("Error running query:", err.message);
      }
    });
  }

  all(query: string, params?: any[]) {
    return new Promise<any[]>((resolve, reject) => {
      this.connection.all(query, params || [], (err, rows) => {
        if (err) {
          console.error("Error fetching data:", err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  get(query: string, params?: any[]) {
    return new Promise<any>((resolve, reject) => {
      this.connection.get(query, params || [], (err, row) => {
        if (err) {
          console.error("Error fetching data:", err.message);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  insert(filePath: string, projectId: string, hash: string) {
    const query = `
      INSERT INTO file_hashes (file_path, project_id, hash)
      VALUES (?, ?, ?)
      ON CONFLICT(file_path) DO UPDATE SET
      project_id = excluded.project_id,
      hash = excluded.hash
    `;
    this.run(query, [filePath, projectId, hash]);
  }
  delete(filePath: string) {
    const query = `DELETE FROM file_hashes WHERE file_path = ?`;
    this.run(query, [filePath]);
  }

  createTables() {
    const createTableQuery = `
            CREATE TABLE IF NOT EXISTS file_hashes (
              file_path TEXT PRIMARY KEY,
              project_id TEXT,
              hash TEXT
            )
          `;

    this.run(createTableQuery);
  }
}

const hashDatabase = new HashDatabase();
hashDatabase.createTables();
export default hashDatabase;
