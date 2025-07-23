const sql = require("./src/lib/db").default;
const fs = require("fs");
const csv = require("csv-parser");

async function loadSAPProductsFromCSV(csvFilePath) {
  console.log(`Loading SAP products from CSV: ${csvFilePath}`);

  if (!fs.existsSync(csvFilePath)) {
    throw new Error(`CSV file not found: ${csvFilePath}`);
  }

  const products = [];

  // Read CSV file
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("data", (row) => {
        if (row.product_name && row.description_link) {
          products.push(row);
        }
      })
      .on("end", async () => {
        try {
          console.log(`Read ${products.length} products from CSV`);
          await processProducts(products);
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

async function processProducts(csvProducts) {
  console.log("Processing and inserting products into database...");

  // Clear existing products
  await sql.query("DELETE FROM sap_products");
  console.log("Cleared existing products from database");

  let insertedCount = 0;
  let skippedCount = 0;

  for (const csvProduct of csvProducts) {
    try {
      const dbProduct = {
        product_name: csvProduct.product_name.trim(),
        description: csvProduct.description_link.trim(),
      };
      await insertProduct(dbProduct);
      insertedCount++;
      if (insertedCount % 100 === 0) {
        console.log(`Inserted ${insertedCount} products...`);
      }
    } catch (error) {
      console.error(
        `Error inserting product \"${csvProduct.product_name}\":`,
        error
      );
      skippedCount++;
    }
  }

  console.log(`\n✅ Load complete!`);
  console.log(`- Inserted: ${insertedCount} products`);
  console.log(`- Skipped: ${skippedCount} products`);
  console.log(`- Total processed: ${csvProducts.length} products`);
}

async function insertProduct(product) {
  const query = `
    INSERT INTO sap_products (
      product_name, description
    ) VALUES ($1, $2)
    ON CONFLICT (product_name) DO UPDATE SET
      description = EXCLUDED.description,
      updated_at = NOW()
  `;

  await sql.query(query, [product.product_name, product.description]);
}

// CLI usage
if (require.main === module) {
  const csvPath = process.argv[2];

  if (!csvPath) {
    console.error("Usage: node load-sap-products-csv.js <path-to-csv-file>");
    process.exit(1);
  }

  loadSAPProductsFromCSV(csvPath)
    .then(() => {
      console.log("✅ SAP products loaded successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Error loading SAP products:", error);
      process.exit(1);
    });
}
