import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

import { contractABI, contractAddress } from "../utils/constants";

export const TransactionContext = React.createContext();

// ethereum object from window.ethereum, object is available due to setting up of MetaMask
// this object allows us to handle our ethereum and blockchain relation
const { ethereum } = window;

const createEthereumContract = () => {
	const provider = new ethers.providers.Web3Provider(ethereum);
	const signer = provider.getSigner();
	const transactionsContract = new ethers.Contract(contractAddress, contractABI, signer);

	return transactionsContract;
    };

        // Every context provider needs to be passed children and return something
        // The data we provide in "<TransactionContext.Provider value={{}}" is passed to our React application so we can connect to the BC from there
    export const TransactionsProvider = ({ children }) => {
	const [formData, setformData] = useState({ addressTo: "", amount: "", keyword: "", message: "" });
	const [currentAccount, setCurrentAccount] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [transactionCount, setTransactionCount] = useState(localStorage.getItem("transactionCount"));
	const [transactions, setTransactions] = useState([]);

	    // we also use the dynamic variable "name" to work with whichever input is chnaged in the formdata
	    // all handleChange functions that interact with inputs accept the keyboard event as the event (e).
	const handleChange = (e, name) => {
	    // as the first parameter react gives you prevState of the inputs which is updated depending on the name
	    // whenever you are updating the new state using the old state you have to provide a callback function in the state where 
		setformData((prevState) => ({ ...prevState, [name]: e.target.value }));
	  };

	  const getAllTransactions = async () => {
		try {
		  if (ethereum) {
			const transactionsContract = createEthereumContract();
	
			const availableTransactions = await transactionsContract.getAllTransactions();
	
			const structuredTransactions = availableTransactions.map((transaction) => ({
			  addressTo: transaction.receiver,
			  addressFrom: transaction.sender,
			  timestamp: new Date(transaction.timestamp.toNumber() * 1000).toLocaleString(),
			  message: transaction.message,
			  keyword: transaction.keyword,
			  amount: parseInt(transaction.amount._hex) / (10 ** 18)
			}));
	
			console.log(structuredTransactions);
	
			setTransactions(structuredTransactions);
		  } else {
			console.log("Ethereum is not present");
		  }
		} catch (error) {
		  console.log(error);
		}
	  };

	const checkIfWalletIsConnect = async () => {
		try {
		  if (!ethereum) return alert("Please install MetaMask.");
	
		  const accounts = await ethereum.request({ method: "eth_accounts" });
	
		  if (accounts.length) {
			setCurrentAccount(accounts[0]);
	
            getAllTransactions();
		  } else {
			console.log("No accounts found");
		  }
		} catch (error) {
		  console.log(error);
		}
	  };

	  const checkIfTransactionsExists = async () => {
		try {
		  if (ethereum) {
			const transactionsContract = createEthereumContract();
			const currentTransactionCount = await transactionsContract.getTransactionCount();
	
			window.localStorage.setItem("transactionCount", currentTransactionCount);
		  }
		} catch (error) {
		  console.log(error);
	
		  throw new Error("No ethereum object");
		}
	  };

	  const connectWallet = async () => {
		try {
		  if (!ethereum) return alert("Please install MetaMask.");
	
		  const accounts = await ethereum.request({ method: "eth_requestAccounts", });
		  
	      // accounts[0] will be to connect first account
		  setCurrentAccount(accounts[0]);
	      //window.location.reload();
		} catch (error) {
		  console.log(error);
	
		  throw new Error("No ethereum object");
		}
	  };

	  const sendTransaction = async () => {
		try {
			if (!ethereum) return alert("Please install MetaMask.");

			const { addressTo, amount, keyword, message } = formData;
			// use transactionsContract variable to call all our contract related functions
			const transactionsContract = createEthereumContract();
			// "parseEther" is an Ethers utility function we can call which parses decimal amount (FE input) into hexadecimal
			const parsedAmount = ethers.utils.parseEther(amount);

			// "await ethereum.request" sends eth from one address to another address
			// eth values are written in hexadecimal as in "gas" below
			await ethereum.request({
				method: "eth_sendTransaction",
				params: [{
				  from: currentAccount,
				  to: addressTo,
				  gas: "0x5208", // equals 21000 GWEI
				  value: parsedAmount._hex,
				}],
			  });

			// call addToBlockchain function so we store "ethereum.request" transactions
			const transactionHash = await transactionsContract.addToBlockchain(addressTo, parsedAmount, message, keyword);

			setIsLoading(true);
        	console.log(`Loading - ${transactionHash.hash}`);
        	await transactionHash.wait();
        	console.log(`Success - ${transactionHash.hash}`);
        	setIsLoading(false);

        	const transactionsCount = await transactionsContract.getTransactionCount();

        	setTransactionCount(transactionsCount.toNumber());
			
			window.reload()
		  } catch {
			
			console.log(error);

			throw new Error("No ethereum object");
		  }
	    }
	
	    // useEffect will run at the start of our application
	  useEffect(() => {
		checkIfWalletIsConnect();
	    checkIfTransactionsExists();
	  }, [transactionCount]);

	return (
		<TransactionContext.Provider
		  value={{
			connectWallet,
			currentAccount,
			formData,
			setformData,
			handleChange,
			sendTransaction,
			transactions,
			isLoading
		  }}
		>
		  {children}
		</TransactionContext.Provider>
	  );
  }