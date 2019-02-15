// Challenge #1
require("dotenv").config();

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
    password: process.env.DBPASS,
    database: "bamazon"
});

connection.connect((err) => {
    if (err) throw err;
    //console.log("connected as id " + connection.threadId + "\n");
    bzManager.showMenu();
});

const bzManager = {
    validPids: [],

    showMenu() {

        // Set up an array of choices so we can easily change them later. Also prevents misspellings. 
        let manageMenuChoices = [
            "View Products for Sale", 
            "View Low Inventory", 
            "Add to Inventory", 
            "Add New Product",
            "Quit"
        ];

        inquirer
            .prompt ([
                {
                type: "list",
                message: "\x1b[32mWhat would you like to do?\x1b[0m",
                name: "manageMenu",
                choices: manageMenuChoices
                }
            ])
            .then((res) => {
                if (res) {
                    switch (res.manageMenu) {
                        case manageMenuChoices[0]:
                            // Show all products, including ones that are out of stock
                            bzManager.displayProducts("all");

                        break;
                        case manageMenuChoices[1]:
                            // Show products with an inventory of less than 5
                            bzManager.displayProducts("low");
                        break;
                        case manageMenuChoices[2]:
                            // Add items to inventory
                            bzManager.addInventory();
                        break;
                            case manageMenuChoices[3]:
                            // Add a new product
                            bzManager.newProduct();
                        break;
                            case manageMenuChoices[4]:
                            // Quit - I got tired of typing Ctrl + C
                            connection.end();
                            break;
                            
                    }
                }
                else {
                    console.log("500: Internal Server Error. Please try again later.");
                }
            });
    },

    listValidProductIds() {
        bzManager.validPids.length = 0;
        connection.query("SELECT id FROM products ", (err, res) => {
            if (err) throw err;
            res.forEach((e) => {
                bzManager.validPids.push(e.id);
            });
        });
    },

    displayProducts(quantity) {
        // This could be split out into a seperate module in the future
        // it basically does the same thing as bzCustomer.displayProducts()
        // without the constraint of products in inventory

        let where = "";
        qty = 0;

        console.log("Products\n");
        switch (quantity) {
            case "all":
                where = "WHERE stock_quantity >= ?";
                qty = 0;
            break;

            case "low":
                where = "WHERE stock_quantity < ?";
                qty = 5;
            break;
        }

        connection.query("SELECT * FROM products " + where, qty, (err, res) => {
            if (err) throw err;
            // Log all results of the SELECT statement or return a message if none were found
            if(res.length > 0) {
                console.log(
                    "Id\t" +
                    "Product\t\t\t\t\t\t\t" +
                    "Department\t" +
                    "Price\t" +
                    "Quantity\n"
                );
                res.forEach((e) => {
                    let pn = e.product_name;
                    let dn = e.department_name;
                    if (pn.length > 50) {
                        pnf = formatter.wordWrap(pn,50);
                    } else {
                        pnf.length = 0;
                        pnf.push(pn);
                    }
                    (dn.length < 7 ? dnf = dn + "\t" : dnf = dn);
                    console.log(
                        e.id + "\t" +
                        pnf[0] + "\t" +
                        dnf + "\t" +
                        e.price + "\t" +
                        e.stock_quantity +
                        (pnf.length > 1 ? "\n\t" + pnf[1] : "")
                        );
                        
                });
            } else {
                console.log("No products were found.\n")
            }
        bzManager.showMenu();
        });
    },

    addInventory() {
        bzManager.listValidProductIds();

        // Pick an id
    
        inquirer
        .prompt ([
            {
            type: "input",
            message: "\x1b[32mPlease enter the ID of the product you would like to increase the stock of:\x1b[0m",
            name: "productToStock",
            validate: (v) => {
                if(bzManager.validPids.indexOf(parseInt(v)) === -1) {
                    return `\n\x1b[31m${v} is not a valid product ID. Please try again.\x1b[0m\n`;
                } else {
                    return true;
                }
                }
            }
        ])
        .then((res) => {
            if (res) {
                let pid = parseInt(res.productToStock);
                // Choose a quantity
                inquirer
                .prompt ([
                    {
                    type: "input",
                    message: "\x1b[32mPlease enter the quantity you would like to add:\x1b[0m",
                    name: "productQty",
                    validate: (v) => {
                        if ((v) > 0) {
                            return true;
                        } else {
                            return "\n\x1b[31mYou have to add at least one unit.\x1b[0m\n";
                        } 
                        }
                    }
                ])
                .then((res) => {
                    if (res) {
                        let qtyToStock = parseInt(res.productQty);

                        connection.query("SELECT stock_quantity FROM products WHERE ?", {"id": pid}, (err, res) => {
                            if (err) throw err
                            let qtyInStock = res[0].stock_quantity;
                            bzManager.updateStock(pid,qtyInStock,qtyToStock);
                        });
                    } else {
                        console.log("500: Internal Server Error. Please try again later.");
                    }
                    bzManager.showMenu(); 
                });
            } else {
                console.log("500: Internal Server Error. Please try again later.");
            }
        });
    },
    
    updateStock(pid,qtyInStock,qtyToStock) {
        let newQty = qtyInStock + qtyToStock;
        connection.query(
            "UPDATE products SET ? WHERE ?",
            [
            {
                "stock_quantity": newQty
            },
            {
                "id": pid
            }
            ],
            (err, res) => {
                if (err) throw err;
                //console.log(res.affectedRows + " products updated!\n");
        });   
    },

    newProduct() {
        inquirer
        .prompt ([
            {
            type: "input",
            message: "\x1b[32mPlease enter the name of the product to add:\x1b[0m",
            name: "productName",
            validate: (v) => {
                if(v === "") {
                    return `\n\x1b[31mPlease enter some text for the product name.\x1b[0m\n`;
                } else {
                    return true;
                }
                }
            },
            {
            type: "input",
            message: "\x1b[32mPlease enter the name of the department the product is associated with:\x1b[0m",
            name: "productDept",
            validate: (v) => {
                if(v === "") {
                    return `\n\x1b[31mPlease enter some text for the department name.\x1b[0m\n`;
                } else {
                    return true;
                }
                }
            },
            {
            type: "input",
            message: "\x1b[32mPlease enter the price of the product:\x1b[0m",
            name: "productPrice",
            validate: (v) => {
                if(v > 0 ) {
                    return true;
                } else {
                    return `\n\x1b[31mThe price must be greater than zero.\x1b[0m\n`;
                }
                }
            },
            {
                type: "input",
                message: "\x1b[32mPlease enter quantity of product to stock:\x1b[0m",
                name: "productQty",
                validate: (v) => {
                    if(v < 0 ) {
                        return `\n\x1b[31mThe quantity cannot be negative.\x1b[0m\n`;
                    } else {
                        return true;
                    }
                    }
                }
            ])
        .then((res) => {
            if (res) {
                console.log("Adding a new product...\n");
                connection.query(
                    "INSERT INTO products SET ?",
                    {
                        "product_name": res.productName,
                        "department_name": res.productDept,
                        "price": res.productPrice,
                        "stock_quantity": res.productQty
                    },
                    (err, res) => {
                        if (err) throw err;
                    console.log(res.affectedRows + " product inserted!\n");
                    }
                );     
            } else {
                console.log("500: Internal Server Error. Please try again later.")
            }
            bzManager.showMenu();
        });
    }
}

// This should definitely be a module in the future
// But I've already spent alot of time on this homework

const formatter = {
    wordWrap(s,w) {
        let fs = [];
        if (s.length <= w) {
            fs.push(s);
            return fs;
        } else {
            let words = s.split(" ");
            let done = false;
            let t = "";
            let nl = 1;

            while(!done) {
                if (words.length === 0) {
                    done = true;
                } else {
                    if (t.length < (nl * w)) {
                        t += words.shift() + " ";
                    }   else {
                        t += "~" + words.shift() + " ";
                        nl++;
                    }
                }
            }
            // Build the final array
            let lines = t.split("~");
            fs.push(lines.shift());
            fs.push(lines.join("\n\t"));
            return fs;
        }
    }
}