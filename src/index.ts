const express = require("express");
const fetch = require("node-fetch");
const csv = require("csv");

require("dotenv").config();

const app = express();

// Trimmed down version of the transfers API response types
type TransfersResponse = {
  count: number;
  transfers: Array<{
    hash: string;
    block_timestamp: number;
    amount: string;
    asset_symbol: string;
  }>;
};

/**
 * Calls the v2/scan/transfers API for the given wallet address
 */
async function fetchTransfers(): Promise<TransfersResponse> {
  try {
    const req = await fetch(
      `${process.env.SUBSCAN_API}/api/v2/scan/transfers`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": process.env.SUBSCAN_API_KEY,
        },
        body: JSON.stringify({
          address: process.env.AZERO_WALLET,
          row: 20,
          page: 0,
        }),
      }
    );

    if (!req.ok) throw new Error(req.status);

    const json = await req.json();

    return json.data;
  } catch (err) {
    console.error(err);
  }
}

/**
 * Generates a Koinly compatible CSV with the provided wallet transfers
 */
async function buildCsv(transfers: TransfersResponse["transfers"]) {
  try {
    const columns = {
      "Koinly Date": "Koinly Date",
      Amount: "Amount",
      Currency: "Currency",
      Label: "Label",
      TxHash: "TxHash",
    };

    const rows = transfers.map(
      ({ amount, asset_symbol, block_timestamp, hash }) => [
        new Date(block_timestamp * 1000).toUTCString(),
        amount,
        asset_symbol,
        "",
        hash,
      ]
    );

    return csv.stringify(rows, { header: true, columns });
  } catch (err) {
    console.error(err);
  }
}

/**
 * Creates an express API route
 * e.g http://localhost:3000/download
 */
app.get("/download", async (req, res) => {
  const { transfers } = await fetchTransfers();

  const csv = await buildCsv(transfers);

  csv.pipe(res);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="' + "download-" + Date.now() + '.csv"'
  );
});

app.listen(process.env.PORT);
