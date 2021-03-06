# marketplace_solidity

### 1. Install ipfs
### 2. Start the ipfs daemon
1. ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin "[\\"*\\"]"
2. ipfs daemon

### 3. Install and start MongoDB
### 4. Open terminal and run `ganache-cli`
### 5. Clone the project and install the dependencies `npm i`
### 6. Open terminal in the project's folder and run `npm run api`
### 7. Open another terminal in the project's folder and run: 
```shell
truffle compile
truffle migrate
```

### 8. Run `npm run dev`
### 9. Open the marketplace page in web browser

Notice: You have to connet the metamask to the private network and import the 
private keys from `ganche-cli` to the metamask. Another option is to run 
`ganache-cli --mnemonic=merit <MNEMONIC_PHRASE>` with the phrase exported from metamask.