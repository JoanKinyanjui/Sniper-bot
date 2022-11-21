// We import ethers to interact with etherium bloclchain
const ethers = require('ethers');
//define addresses
const addresses = {
    WBNB: ''
    factory: ''
    router: ''
    recipient: ''
}
//First address of this mnemonic must have enough BNB to pay tx fees
const mnemonic = ''
// We create a connection to the binance smart chain
// since we will be listening to events we will need a websocket url
const provider = new ethers.providers.WebSocketProvider('');
//create a wallet object whiich will allow us sign txs
const wallet = ethers.wallet.fromMnemonic(mnemonic);
//we connect this  wallet object to our provider so ethers know how to sign tx
const account = wallet.connect(provider);
//define  a  contract object for the factory contract
// -contract address
// -contract abi
// -account (address we use to sign the tx)
const factory = new ethers.Contract(
    addresses.factory,
    ['event PairCreated(address indexed token0, address indexed token1, address pair, uint)'],
    account
);
const router = new ethers.Contract(
    addresses.router,
    [
    'function getAmountsOut(uint amountIn, address[] memory path) public view returns(uint[] memory amounts)',
    'function SwapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, )'
    account
]
);
// we are going to listen to the pair created event to listen when a new liquidity pool is created
// everytime an event is emitted, its going to run the callback function and its going to pass it different fields,
// the address of the two tokens and  the pair smart contract address, then we log the info
factory.on('PairCreated', async (token0, token1, pairAddress) => {
    console.log(`
    New pair detected
    ===================
    token0: ${token0}
    token1: ${token1}
    pairAddress: ${pairAddress}
    `);
    //The we check if one of the token is WBNB bcoz we gonna buy thr token using WBNB
    //If the quote currency is not WBNB we not gonna  buy bcoz our script is only designed to purchase with WBNB
    let tokenIn, tokenOut;
    //If the tokenIn is WBNB we gonna buy the other token
    if (token0 === addresses.WBNB) {
        tokenIn = token0;
        tokenOut = token1;
    }
    //If the other token is WBNB the tokenOut is gonna be token0
    if(token1 == addresses.WBNB) {
        tokenIn = token1;
        tokenOut = token0;
    }
    // if non of the token in the liquidity pool is WBNB we stop here and calculate how much of the token we are going tobyu
    if (typeof tokenIn == 'undefined') {
        return;
    }
    // calculate how much of the token we are going to buy
    // we buy for 0.1 BNB of the new token
    //ethers was originally created for etherium but since bsc is a fork of etherium it also works
    // ether == bnb on BSC
    const amountIn = ethers.utils.parseUnits('0.1', 'ether');
    //we pass the amount in BNB we want to buy worth of the token,
    //Then pass in the token addresses of the tokens
    const amounts = await router.getAmountsOut(amountIn, [tokenIn, tokenOut]);
    const amountOutMin = amounts[1].sub(amounts[1].div(10));
    console.log(`
    Buying new token
    ==================
    tokenIn: ${amountIn.toString()} ${tokenIn} (WBNB)
    tokenOut: ${amountOutMin.toString()} ${tokenOut}
    `);
    const tx = await router.swapExactTokensForTokens(
        amountIn,
        amountOutMin,
        [tokenIn, tokenOut],
        addresses.recipient,
        //set our deadline fter which the tx is not valid, incase of network clog
        Date.now() + 1000 * 60 * 10 //10 minutes
    );
    const receipt = await tx.wait();
    console.log('transaction receipt');
    console.log(receipt);
});