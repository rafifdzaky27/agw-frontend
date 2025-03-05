import pool from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req) {
    try {
      const body = await req.json();
      const { full_name, username, password, role, group, email, phone_number } = body;
  
      if (!full_name || !username || !password || !role || !group || !email || !phone_number) {
        return new Response(JSON.stringify({ error: "All fields are required" }), { status: 400 });
      }
  
      const validRoles = ["maker", "checker", "approver"];
      const validGroups = ["Architecture", "Developer", "Operation"];
  
      if (!validRoles.includes(role) || !validGroups.includes(group)) {
        return new Response(JSON.stringify({ error: "Invalid role or group" }), { status: 400 });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      await pool.query(
        `INSERT INTO users (full_name, username, password, role, "group", email, phone_number) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [full_name, username, hashedPassword, role, group, email, phone_number]
      );
  
      return new Response(JSON.stringify({ message: "User created" }), { status: 201 });
    } catch (error) {
      console.error("Database error:", error);
      return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
  }

export async function GET() {
  try {
    const result = await pool.query("SELECT id, name, username, role, division FROM users");

    return new Response(JSON.stringify(result.rows), { status: 200 });
  } catch (error) {
    console.error("Database error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
