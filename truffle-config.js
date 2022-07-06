const path = require("path");
require('dotenv').config({path: './.env'});
const HDWalletProvider = require('@truffle/hdwallet-provider');
const MetaMaskAccountIndex = 0;

module.exports = {
    contracts_build_directory: path.join(__dirname, "../web/src/contracts"),
    networks: {
        develop: {
            port: 8545,
        },
        infura:{
            provider: function () {
                return new HDWalletProvider(
                    process.env.MNEMONIC,
                    "https://rinkeby.infura.io/v3/" + process.env.INFURA_API_KEY,
                    MetaMaskAccountIndex
                );
            },
            network_id: "4",
        },
        ganache: {
            provider: function () {
                return new HDWalletProvider(
                    process.env.GANACHE_MNEMONIC,
                    "http://127.0.0.1:8545",
                    MetaMaskAccountIndex
                );
            },
            network_id: 5777
        }
    },
    compilers: {
        solc: {
            version: "0.6.1",
        },
    },
};
