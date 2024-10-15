import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import NavBar from './components/NavBar';
import axios from 'axios';
import PhraseBox from './components/PhraseBox';
import WalletBox from './components/WalletBox';
import './App.css';

const App = () => {
  const [seedPhrase, setSeedPhrase] = useState('');
  const [wallets, setWallets] = useState([]);
  const [selectedWalletIndex, setSelectedWalletIndex] = useState(0);
  const [selectedWallet, setSelectedWallet] = useState({});
  const [walletBalance, setWalletBalance] = useState();
  const [isTransactionForm, setIsTransactionForm] = useState(false);
  const [limit, setLimit] = useState('');

  // Function to save wallets to local storage
  const saveWalletsToLocalStorage = (wallets) => {
    localStorage.setItem('wallets', JSON.stringify(wallets));
  };

  // Function to retrieve wallets from local storage
  const loadWalletsFromLocalStorage = () => {
    const savedWallets = localStorage.getItem('wallets');
    if (savedWallets) {
      const parsedWallets = JSON.parse(savedWallets);
      setWallets(parsedWallets);
      if (parsedWallets.length > 0) {
        setSelectedWallet(parsedWallets[0]);
      }
    }
  };

  // Generate seed phrase
  const generateSeedPhrase = () => {
    const mnemonic = ethers.Mnemonic.entropyToPhrase(ethers.randomBytes(16));
    setSeedPhrase(mnemonic);
  };

  // Create wallet from seed
  const createWalletFromSeed = () => {
    if (!seedPhrase) return;
    const hdNode = ethers.HDNodeWallet.fromPhrase(seedPhrase, `m/44'/60'/0'/0/${wallets.length}`);

    const walletWithId = {
      id: wallets.length + 1,
      address: hdNode.address,
      privateKey: hdNode.privateKey,
      publicKey: hdNode.publicKey,
      signingKey: hdNode.signingKey,
      mnemonic: hdNode.mnemonic.phrase,
      path: hdNode.path,
    };

    setSelectedWallet(hdNode);
    const newWallets = [...wallets, walletWithId];
    setWallets(newWallets);
    setSelectedWalletIndex(newWallets.length - 1);
    setIsTransactionForm(false);

    // Save wallets to local storage
    saveWalletsToLocalStorage(newWallets);

    fetchBalance(walletWithId);
  };

  // Handle wallet selection change
  const handleChange = (e) => {
    const selectedIndex = parseInt(e.target.value, 10);
    const selectedWallet = wallets[selectedIndex];
    setSelectedWallet(selectedWallet);
    setSelectedWalletIndex(selectedIndex);
    setIsTransactionForm(false);
  };

  // Fetch wallet balance
  const fetchBalance = async (wallet) => {
    if (wallet) {
      const response = await axios.post(import.meta.env.VITE_ALCHEMY_RPC_URL,
        {
          "jsonrpc": "2.0",
          "id": 1,
          "method": "eth_getBalance",
          "params": [wallet.address, "latest"]
        },
        {
          headers: {
            "Content-Type": "application/json",
          }
        }
      );

      if (response.data) {
        const hexValue = response.data.result;
        let decimalValue = BigInt(hexValue).toString(10);
        decimalValue /= 1e18;
        if (decimalValue != 0) {
          const formattedNumber = parseFloat(decimalValue).toFixed(4);
          setWalletBalance(formattedNumber);
        } else {
          setWalletBalance(decimalValue);
        }

      } else {
        console.log('Error fetching balance');
      }
    }
  };

  // Load wallets from local storage on component mount
  useEffect(() => {
    loadWalletsFromLocalStorage();
  }, []);

  // Fetch balance at regular intervals
  useEffect(() => {
    const interval = setInterval(() => {
      if (wallets.length > 0) {
        fetchBalance(selectedWallet);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedWallet, wallets.length]);



  const handleSetLimit = () => {
    const newLimit = parseInt(document.querySelector('.limitInput').value);
    setLimit(newLimit);
  };

  return (
    <div className="root">
      <div className="main">
        <div className="gradient" />
      </div>
      <NavBar />
      <div className='main gradiant main-container'>
        <div className='container'>
          <h1 className='heading'>Experiment with wallet creation and blockchain transactions in a hands-on learning environment</h1>
          <div className={`${seedPhrase ? 'hidden' : 'block'}`}>
            <button onClick={generateSeedPhrase} style={{ marginBottom: '10px' }} className='buttons'>
              Generate Seed Phrase
            </button>
          </div>

          {seedPhrase && (
            <div className='phrase-container'>
              <PhraseBox seedPhrase={seedPhrase} />
              <div className='margin-top-15'>
                <button onClick={createWalletFromSeed} className='buttons'>
                  {wallets.length ? `Add Account` : 'Create a Wallet'}
                </button>
              </div>
            </div>
          )}

          {wallets.length > 0 && (
            <>
            <WalletBox limit={limit} wallets={wallets} selectedWalletIndex={selectedWalletIndex} handleChange={handleChange} walletBalance={walletBalance} selectedWallet={selectedWallet} isTransactionForm={isTransactionForm} setIsTransactionForm={setIsTransactionForm} />
            <p>set limit</p>
            <input type='number' className='limitInput'/>
            <button onClick={handleSetLimit}>
              Set Limit
            </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default App;
