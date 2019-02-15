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
    bzCustomer.displayProducts();
});

const bzCustomer = {
    validPids: [],

    // Display items for sale (id, name, department, price, quantity)
    displayProducts() {
        bzCustomer.validPids.length = 0;

        console.log("Products for sale\n");

        connection.query("SELECT * FROM products WHERE stock_quantity > 0", (err, res) => {
            if (err) throw err;
            // Log all results of the SELECT statement
            console.log(
                "Id\t" +
                "Product\t\t\t\t\t\t\t" +
                "Department\t" +
                "Price\t" +
                "Quantity\n"
            );
            res.forEach((e) => {
                bzCustomer.validPids.push(e.id);
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
        bzCustomer.getProduct();
        });
    },

    // Ask customer for the ID of the item they would like to buy
    getProduct() {
        inquirer
        .prompt ([
            {
            type: "input",
            message: "\x1b[32mPlease enter the ID of the product you would like to buy:\x1b[0m",
            name: "productToBuy",
            validate: (v) => {
                if(bzCustomer.validPids.indexOf(parseInt(v)) === -1) {
                    return `\n\x1b[31m${v} is not a valid product ID. Please try again.\x1b[0m\n`;
                } else {
                    return true;
                }
                }
            }
        ])
        .then((res) => {
            if (res) {
                let pid = parseInt(res.productToBuy);
                bzCustomer.getQuantity(pid);
            }
            else {
                console.log("500: Internal Server Error. Please try again later.");
            }
        });
    },

    // Ask the customer how many of the item they would like to buy
    getQuantity(pid) {
        inquirer
        .prompt ([
            {
            type: "input",
            message: "\x1b[32mPlease enter the quantity you would like to buy:\x1b[0m",
            name: "productQty",
            validate: (v) => {
                if (v > 0) {
                    return true;
                 } else {
                     return "\n\x1b[31mYou have to purchase at least one item.\x1b[0m\n";
                } 
                }
            }
        ])
        .then((res) => {
            if (res) {
                let qtyToBuy = parseInt(res.productQty);
                // Check to see if the store has enough of the item available
                connection.query("SELECT stock_quantity FROM products WHERE ?", {"id": pid}, (err, res) => {
                    if (err) throw err;
                    let qtyInStock = res[0].stock_quantity;
                    if(qtyToBuy > qtyInStock) {
                        
                        // Ask if customer would like to buy all remaining items
                        inquirer
                        .prompt ([
                            {
                            type: "confirm",
                            message: `\x1b[32mWould you like to buy all ${qtyInStock} that are available?\x1b[0m`,
                            name: "buyAll"    
                            }
                        ])
                        .then((res) => {
                            if (res.buyAll) {
                                // Confirm, sell them all the items
                                qtyToBuy = qtyInStock;
                                bzCustomer.makePurchase(pid,qtyInStock,qtyToBuy);
                            } else {
                                // Decline, go back to start
                                bzCustomer.displayProducts();
                            }
                        });
                    } else {
                        // Store does have enough stock, fulfill order
                        bzCustomer.makePurchase(pid,qtyInStock,qtyToBuy);
                    }
                });
            } else {
                console.log("500: Internal Server Error. Please try again later.");
            }
        });        
    },

    makePurchase(pid,qtyInStock,qtyToBuy) {
        // Update database to reflect new quantity
        let newQty = qtyInStock - qtyToBuy;
       
        let query = connection.query(
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
            }
        );
        // Show customer the total cost of their order
        query = connection.query(
            "SELECT price FROM products WHERE ?", {"id": pid}, (err, res) => {
                let totalPurchase = res[0].price * qtyToBuy;
                console.log(`\x1b[36mThank you for shopping with Bamazon. Your total cost is: $${totalPurchase.toFixed(2)}\x1b[0m`);
                connection.end();
            }
        )
    }
}

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