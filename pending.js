require('dotenv').config()
const {ethers} = require('ethers')
const url = process.env.URL



async function main(){
//Create a connection to the blockchain
const provider = new ethers.providers.WebSocketProvider('wss://eth-mainnet.nodereal.io/ws/v1/e114365d0a93405eb030afd2d01375bd')

//subscribe to an event.
provider.on('pending', async (tx)=>{
    const transcInfo = await provider.getTransaction(tx)
    console.log(transcInfo)
})

//Incase of an error ,this function will restart websocket connection.
provider.on('error',async ()=>{
    console.log(`unable to coonect to,retrying in 3s`);
    setTimeout(main,3000);
})
//Incase a connection dies this function restarts the websockets connection
 provider.on('close',async(code)=>{
   console.log (`connection lost with ${code}!Attempt in 3s`)
   provider.terminate();
   setTimeout(main,3000);
})
}
main();