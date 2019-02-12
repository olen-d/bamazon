// Challenge #1
const mysql = require("mysql");
const inquirer = require("inquirer");

// Create the database connection
const connection = mysql.createConnection({
    host: "localhost",

    // Your port; if not 3306
    port: 3306,

    // Your username
    user: "Olen",

    // Your password
    password: "cheeseBurger99!",
    database: "bamazon"
});

connection.connect((err) => {
    if (err) throw err;
    //console.log("connected as id " + connection.threadId + "\n");
    bzManager.showMenu();
});

const bzManager = {
    showMenu() {
        inquirer
            .prompt ([
                {
                type: "list",
                message: "\x1b[32mWhat would you like to do?\x1b[0m",
                name: "manageMenu",
                choices: ["View Products for Sale", "View Low Inventory", "Add to Inventory", "Add New Product"]
                }
            ])
            .then((res) => {
                if (res) {
                    let choice = parseInt(res.choices);
                    console.log("(())(()))((()", res.manageMenu);
                    //bzCustomer.getQuantity(pid);
                }
                else {
                    console.log("500: Internal Server Error. Please try again later.");
                }
            });
    }
    // List a set of menu options:

    // View Products for Sale
    
    // View Low Inventory
    
    // * Add to Inventory
    
    // * Add New Product
}