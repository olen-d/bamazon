-- Challenge #1

CREATE DATABASE bamazon;
USE bamazon;

CREATE TABLE products (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(255),
    department_name VARCHAR(255),
    price FLOAT,
    stock_quantity INT
);