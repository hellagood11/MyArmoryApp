# MyArmoryApp

MyArmoryApp is a web app for organizing an armory and ammunition inventory. It also includes a ballistics calculator, reloading data tables, and a reviews page.

## Features

- View, search, and filter inventory items.
- Add, edit, and delete inventory records stored in MongoDB.
- Confirm before deleting an inventory item.
- Calculate estimated energy, momentum, and bullet drop.
- Browse and filter reloading data from CSV files.
- View and submit reviews in the browser.

> **Note:** This project is a class demonstration. Use sample data only. Do not put sensitive personal inventory information into a publicly accessible deployment.

## Requirements

- [Node.js](https://nodejs.org/) and npm
- A MongoDB database, such as a MongoDB Atlas cluster
- Git, if cloning the project

## Setup

### 1. Get the project

Clone the repository and enter its folder:

```bash
git clone https://github.com/hellagood11/MyArmoryApp.git
cd MyArmoryApp
```

Alternatively, download the repository from GitHub and open its folder in a terminal.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure MongoDB

Create or select a MongoDB database and collection for the inventory. In MongoDB Atlas, make sure your database user has the permissions needed by the app and that your development machine is allowed to connect to the cluster.

Create a file named `.env` in the project root, next to `server.js`. Add:

```env
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=your_database_name
MONGODB_COLLECTION=your_collection_name
PORT=3000
```

Replace the placeholder values with your own settings. Keep the real `.env` file private; **do not commit it to GitHub**. The repository’s `.gitignore` excludes `.env`.

### 4. Start the server

```bash
npm start
```

Open the app in a browser:

- Home: `http://localhost:3000/`
- Armory inventory: `http://localhost:3000/armory.html`
- Database health check: `http://localhost:3000/api/health`

Keep the terminal running while you use the app. Press `Ctrl+C` in the terminal to stop the server.

## Project structure

```text
MyArmoryApp/
├── public/                 # HTML pages, CSS, browser JavaScript, and CSV data
├── server.js               # Express server and MongoDB API
├── package.json            # Dependencies and npm scripts
├── package-lock.json       # Locked dependency versions
└── .gitignore              # Excludes local secrets and installed dependencies
```

## Inventory API

The browser-based inventory page communicates with the Express server, which reads and writes inventory records in MongoDB.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/inventory` | List inventory items |
| `POST` | `/api/inventory` | Add an item |
| `PUT` | `/api/inventory/:id` | Edit an item |
| `DELETE` | `/api/inventory/:id` | Delete an item |
| `GET` | `/api/health` | Check server and database connectivity |

Inventory records include a name, item type, caliber or cartridge, quantity, and date fields maintained by the server.

## Troubleshooting

- If the server reports missing MongoDB environment variables, check that `.env` is in the project root and that the variable names are spelled correctly.
- If MongoDB refuses the connection, verify the connection string, database user permissions, and Atlas network access settings.
- If port `3000` is already in use, set `PORT` in `.env` to another available port and open that port in your browser.
- If inventory changes do not appear, check the terminal for server errors and the browser developer console for request errors.