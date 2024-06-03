const express = require('express');
const axios = require('axios').default;

const web3 = require('@solana/web3.js');

const app = express();
const port = 3000;

const connection = new web3.Connection('https://api.mainnet-beta.solana.com');

app.get('/token/', async (req, res) => {
  try {
    const tokenA = 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN';

    const dexscreenerResponse = await axios.get(
      `https://api.dexscreener.com/latest/dex/tokens/${tokenA}`
    );

    const dexscreenerData = dexscreenerResponse.data;
    const lastPair = dexscreenerData.pairs[0];
    const liquidity = lastPair.liquidity.usd;

    const pubKey = new web3.PublicKey(tokenA);
    const signatures = await connection.getSignaturesForAddress(pubKey, {
      limit: 1,
    });

    const signatureList = signatures.map(
      (transaction) => transaction.signature
    );

    const transactionDetails = await connection.getParsedTransactions(
      signatureList,
      {
        maxSupportedTransactionVersion: 0,
      }
    );

    const transactionsInfo = signatures.map((transaction, i) => {
      const date = new Date(transaction.blockTime * 1000);

      const info = {
        blockTime: date,
        slot: transaction.slot,
        wallet: transactionDetails[i].transaction.message.accountKeys[0].pubkey,
        amount:
          transactionDetails[i].meta.postTokenBalances[0].uiTokenAmount
            .uiAmount,
        transaction: transactionDetails[i].transaction,
      };
      return info;
    });

    const result = {
      liquidity,
      transactionsInfo: transactionsInfo,
    };

    res.json(result);
  } catch (error) {}
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
