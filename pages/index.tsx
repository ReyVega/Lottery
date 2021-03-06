// Libraries and components used
import type { NextPage } from 'next'
import { useState, useEffect } from 'react'
import Web3 from 'web3'
import Head from 'next/head'
import lotteryContract from '../blockchain/lottery'
import styles from '../styles/Home.module.css'
import "bulma/css/bulma.css"

// Window variable
declare const window: any;

// Interface to store lotteryId and winner's address
interface historyObj {
  id: number;
  address: string;
}

// Home page
const Home: NextPage = () => {

  // Hooks used
  const [web3, setWeb3] = useState<any>()
  const [address, setAddress] = useState<string>()
  const [lcContract, setLcContract] = useState<any>()
  const [lotteryPot, setLotteryPot] = useState<any>()
  const [lotteryPlayers, setPlayers] = useState<any>([])
  const [lotteryHistory, setLotteryHistory] = useState<Array<historyObj>>([])
  const [lotteryId, setLotteryId] = useState<number>()
  const [error, setError] = useState<string>()
  const [successMsg, setSuccessMsg] = useState<string>()

  // Hook to update smart contract's state after rendering page
  useEffect(() => {
    updateState()
  }, [lcContract])

  // Update all variables of smart contract
  const updateState = () => {
    if (lcContract) getPot()
    if (lcContract) getPlayers()
    if (lcContract) getLotteryId()
  }

  // Get current balance of all the players bettings
  const getPot = async () => {
    const pot = await lcContract.methods.getBalance().call()
    setLotteryPot(web3.utils.fromWei(pot, 'ether'))
  }

  // Get all the current players playing
  const getPlayers = async () => {
    const players = await lcContract.methods.getPlayers().call()
    setPlayers(players)
  }

  // Get all the winners from previous lotteries
  const getHistory = async (id: string) => {
    setLotteryHistory([])
    for (let i = parseInt(id); i > 0; i--) {
      const winnerAddress = await lcContract.methods.lotteryHistory(i).call()
      const historyObj: historyObj = {id: -1, address: ""}
      historyObj.id = i
      historyObj.address = winnerAddress
      setLotteryHistory(lotteryHistory => [...lotteryHistory, historyObj])
    }
  }

  // Get current lotteryId
  const getLotteryId = async () => {
    const lotteryId = await lcContract.methods.lotteryId().call()
    setLotteryId(lotteryId)
    await getHistory(lotteryId)
  }

  // Render player's name if the player could enter the lottery
  const enterLotteryHandler = async () => {
    setError("")
    setSuccessMsg("")
    try {
      await lcContract.methods.enter().send({
        from: address,
        value: '15000000000000000',
        gas: 300000,
        gasPrice: null
      })
      updateState()
    } catch(err: any) {
      setError(err.message)
    }
  }

  // Pick winner from lottery
  const pickWinnerHandler = async () => {
    setError("")
    setSuccessMsg("")
    console.log(`address from pick winner :: ${address}`)
    try {
      await lcContract.methods.pickWinner().send({
        from: address,
        gas: 300000,
        gasPrice: null
      })
    } catch(err: any) {
      setError(err.message)
    }
  }

  // Transfer the total balance to the winner
  const payWinnerHandler = async () => {
    setError("")
    setSuccessMsg("")
    try {
      await lcContract.methods.payWinner().send({
        from: address,
        gas: 300000,
        gasPrice: null
      })
      console.log(`lottery id :: ${lotteryId}`)
      const winnerAddress = await lcContract.methods.lotteryHistory(lotteryId).call()
      setSuccessMsg(`The winner is ${winnerAddress}`)
      updateState()
    } catch(err: any) {
      setError(err.message)
    }
  }

  // Connect MetaMask wallet
  const connectWalletHandler = async () => {
    setError("")
    setSuccessMsg("")

    // Check if MetaMask is installed
    if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      try {
        // Request wallet connection
        await window.ethereum.request({ method: "eth_requestAccounts"})

        // Create web3 instance and set to state
        const web3 = new Web3(window.ethereum)

        // Set web3 instance in React state
        setWeb3(web3)

        // Get list of MetaMask accounts
        const accounts = await web3.eth.getAccounts()

        // Set account 1 to React state
        setAddress(accounts[0])

        // Create local contract copy
        const lc = lotteryContract(web3)
        setLcContract(lc)

        window.ethereum.on('accountsChanged', async () => {
          const accounts = await web3.eth.getAccounts()
          console.log(accounts[0])
          // Set account 1 to React state
          setAddress(accounts[0])
        })
      } catch(err: any) {
        setError(err.message)
      }
    } else {
      // MetaMask is not installed
      console.log("Please install MetaMask")
    }
  }

  // Frontend of the home page
  return (
    <div className={styles.bg}>
      <Head>
        <title>Ether Lottery</title>
        <meta name="description" content="An Ethereum Lottery App" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <nav className={styles.navbar}>
          <div className="container">
            <div className="navbar-brand">
              <h1>Ether Lottery</h1>
            </div>
            <div className="navbar-end">
              <button onClick={connectWalletHandler} className="button is-link">Connect Wallet</button>
            </div>
          </div>
        </nav>
        <div className="container">
          <section className="mt-5">
            <div className="columns">
              <div className="column is-two-thirds">
                <section className="mt-5">
                  <p>Enter the lottery by sending 0.01 Ether</p>
                  <button onClick={enterLotteryHandler} className="button is-link is-large is-light mt-3">Play now</button>
                </section>
                <section className="mt-6">
                  <p><b>Admin only:</b> Pick winner</p>
                  <button onClick={pickWinnerHandler} className="button is-primary is-large is-light mt-3">Pick Winner</button>
                </section>
                <section className="mt-6">
                  <p><b>Admin only:</b> Pay winner</p>
                  <button onClick={payWinnerHandler} className="button is-success is-large is-light mt-3">Pay Winner</button>
                </section>
                <section>
                  <div className="container has-text-danger mt-6">
                    <p>{error}</p>
                  </div>
                </section>
                <section>
                  <div className="container has-text-success mt-6">
                    <p>{successMsg}</p>
                  </div>
                </section>
              </div>
              <div className={`${styles.lotteryinfo} column is-one-third`}>
                <section className="mt-5">
                  <div className="card">
                    <div className="card-content">
                      <div className="content">
                        <h2>Lottery History</h2>
                        {
                          (lotteryHistory && lotteryHistory.length > 0) && lotteryHistory.map(item => {
                            if (lotteryId != item.id) {
                              return <div className="history-entry mt-3" key={item.id}>
                                <div>Lottery #{item.id} winner:</div>
                                <div>
                                  <a href={`https://etherscan.io/address/${item.address}`} target="_blank">
                                    {item.address}
                                  </a>
                                </div>
                              </div>
                            }
                          })
                        }
                      </div>
                    </div>
                  </div>
                </section>
                <section className="mt-5">
                  <div className="card">
                    <div className="card-content">
                      <div className="content">
                        <h2>Players ({lotteryPlayers.length})</h2>
                        <ul className="ml-0">
                          {
                            (lotteryPlayers && lotteryPlayers.length > 0) && lotteryPlayers.map((player: string, index: number) => {
                              return <li key={`${player}-${index}`}>
                                <a href={`https://etherscan.io/address/${player}`} target="_blank">
                                  {player}
                                </a>
                              </li>
                            })
                          }
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>
                <section className="mt-5">
                  <div className="card">
                    <div className="card-content">
                      <div className="content">
                        <h2>Pot</h2>
                        <p>{lotteryPot} Ether</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>&copy; 2022 Lottery</p>
      </footer>
    </div>
  )
}

export default Home
