import { connect, connection } from "mongoose";

const conn = {
    isConected: false,
}

export async function dbConnect() {
    if(conn.isConected) return;
    const db = await connect(process.env.MONGODB_INTEGRAL_DB || "");
    conn.isConected = db.connections[0].readyState ? true : false; 
    console.log(db.connection.db.databaseName);
}

connection.on("connected", () => {
    console.log("Mongo Its Running on CHERCED WORLD!")
});

connection.on("error", (err) => {
    console.log(err)
});