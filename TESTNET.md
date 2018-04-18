# Getting started with a private network

This document will take you through the process and all the potential gotchas 
you may come across. Feel free to add anything you come across.

# Get Geth and Truffle

Installing geth is best described on their page. [Geth installation](https://ethereum.github.io/go-ethereum/install/)

Installing truffle is straightforward if you already have node and npm or yarn 
installed. Use either of the following.

```
yarn global add truffle
```

or

```
npm install -g truffle
```

If you don't have node, installing with nvm is easy.

```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.9/install.sh | bash
nvm install node && nvm use node
```

# Get Polyswarm contracts

```bash
git clone git@github.com:polyswarm/polyswarm-truffle.git
cd polyswarm-truffle
git checkout testing
npm i
```

You want to use the testing branch, since it does not have the main net addresses inside.

# Stand up a private testnet

There is a handy script for this in the polyswarmd repo. If you don't want to use that repo, there are some instructions linked at the bottom of this page that will assist you.

Checkout the polyswarmd repo. 

```
git clone git@github.com:polyswarm/polyswarmd.git
```

Run the script.

```
./scripts/launch_geth_testnet.sh
```

It comes with a funded account using address `0xaf8302a3786a35abeddf19758067adc9a23597e5`
and password `password`. The genesis file ensures this account comes with more 
ETH than you could ever need. Please use this account only on the testnet, since
the keyfile and password are public.

To connect to the geth console, use 
```
geth attach ipc:$HOME/.ethereum/priv_testnet/geth.ipc
```

That will open a console where you can use commands to interact with the chain.
Here are some example commands.

```
personal.unlockAccount(eth.coinbase, 'password')
```

```
eth.getBalance(eth.coinbase)
```

```
eth.accounts
```

```
eth.sendTransaction({from:sender, to:receiver, value: amount})
```

```
miner.setEtherbase(eth.accounts[0])
```

# Getting Contracts onto testnet

Deploying the contracts to the testnet is the most problematic part of this 
process. There are many gotchas on the way with nondescriptive error messages.

Before we can deploy the migrations, we need to fix some things. 

Edit the `truffle_config.js` file and set the gas value in the development
  object to 4612388. 

  ```javascript
  development: {
      host: 'localhost',
      port: 8545,
      network_id: '*',
      gas: 4612388
    },
  ```

After that, we should be ready to go. Use `truffle compile` to compile all the 
solidity contracts to EVM byte code. Use `truffle migrate` to deploy the 
contracts. During the migration, it will print the contract addresses. Copy 
those, as you will need to put them into the `polyswarmd.cfg` file later. 

If for any reason, you modified the contract, or something stops working, 
redeploy using `truffle migrate --reset`.

Once it is deployed, you can use `truffle console` to interact with the chain. 
You can use any of the commands you would normally use in the geth console by 
prepending `web3.` to the command. Additionally, it provides an easy way to 
interact with deployed contracts. Instead of generating transactions by hand, 
you can interact with commands like 
```
NectarToken.at(NectarToken.address).transfer(web3.eth.coinbase, <some target addr>, web3.toWei(.05)))
``` 
or 

```
NectarToken.at(NectarToken.address).mint(web3.eth.coinbase, web3.toWei(1000))
```


## Truffle gotchas

There are some points in the process that can trip people up. This section will help you with the most common problems.

### Undefined address In truffle migrate
There are a surprising amount of errors with a similar message. There are two 
common ones you are likely to see.

First, if you deploy and it says you need to unlock you account, even though 
you unlocked it too recently for it to be locked again, you probably have more
than one account for the network. Use `web3.eth.accounts` to see how many you
have. You need to delete the extra accounts. The `genesis.json` file defines 
only account `0xaf8302a3786a35abeddf19758067adc9a23597e5` as having any ETH,
so that is the account you will want to keep. 

To delete extra accounts delete files in 
`$HOME/.ethereum/<testnet dir>/keystore.`

The second error, is one where migrate always results in an error about 
exceeding the gas limit. Edit the `truffle_config.js` file and set the gas 
value in the development object to 4612388. 

```javascript
development: {
    host: 'localhost',
    port: 8545,
    network_id: '*',
    gas: 4612388
  },
```
### Need to unlock

Your wallet only remains unlocked for a short period of time. Unlock in truffle console with 

```
web3.personal.unlockAccount(web3.eth.coinbase, 'password')
```

### No coinbase setup

This usually happens if you create a new account. Easy fix. 

```
web3.miner.setEtherbase(web3.eth.accounts[0])
```

# Further Reading

Some interesting reads for getting to know Ethereum and how to build networks a little better

[Etherem Docs & how to setup a testnet](http://ethdocs.org/en/latest/introduction/index.html)

[Truffle documentation](http://truffleframework.com/docs/)
