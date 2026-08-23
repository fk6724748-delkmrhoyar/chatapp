import { seedDatabase } from "./seed";
import { pool } from "./index";

seedDatabase().then(() => {
  console.log("Seed completed.");
  pool.end();
}).catch((err) => {
  console.error("Seed failed:", err);
  pool.end();
});
