import { useState, useEffect } from "react";
import { ethers } from "ethers";
import MusicRoyaltyABI from "./abi/MusicRoyalty.json";
import { CONTRACT_ADDRESS } from "./contractConfig";
import "./App.css";


function App() {

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [metadataURI, setMetadataURI] = useState("");
  const [collaboratorWallet, setCollaboratorWallet] = useState("");
  const [percentage, setPercentage] = useState("");


  const [account, setAccount] = useState("");
  
  const getReadContract = () => {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

    return new ethers.Contract(
      CONTRACT_ADDRESS,
      MusicRoyaltyABI.abi,
      provider
    );
  };

  const getWriteContract = async () => {
    if (!window.ethereum) {
      alert("MetaMask belum terinstall");
      return null;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    return new ethers.Contract(
      CONTRACT_ADDRESS,
      MusicRoyaltyABI.abi,
      signer
    );
  };

  const handleUploadSong = async (e) => {
    e.preventDefault();
    try {
      if (!account) {
        alert("Connect wallet terlebih dahulu");
        return;
      }

      const contract = await getWriteContract();
      if (!contract) return;

      const wallets = [collaboratorWallet];
      const percentages = [Number(percentage)];

      const tx = await contract.uploadSong(
        title,
        artist,
        metadataURI,
        wallets,
        percentages
      );

      alert("Transaksi upload lagu sedang diproses...");
      await tx.wait();

      alert("Lagu berhasil diupload");

      setTitle("");
      setArtist("");
      setMetadataURI("");
      setCollaboratorWallet("");
      setPercentage("");

      loadSongs();
    } 
    catch (error) {
      console.error("Upload song error:", error);
      alert("Gagal upload lagu. Pastikan total persentase = 100.");
    }
  };

    const handleClaimRoyalty = async () => {
      try {
        if (!account) {
          alert("Connect wallet terlebih dahulu");
          return;
        }

        const contract = await getWriteContract();
        if (!contract) return;

        const tx = await contract.claimRoyalty();

        alert("Proses klaim royalti...");
        await tx.wait();

        alert("Royalti berhasil diklaim");
        loadSongs();
      } 
      catch (error) {
        console.error("Claim royalty error:", error);
        alert("Gagal klaim royalti. Pastikan wallet memiliki saldo royalti.");
      }
    };
  
  // DATA SEMENTARA (mock data) - Nanti diganti dengan data dari smart contract
  const [songs, setSongs] = useState([]);

  // Connect ke MetaMask
  const connectWallet = async () => {
  try {
    if (!window.ethereum) {
      alert("MetaMask belum terinstall");
      return;
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    setAccount(accounts[0]);
  } catch (error) {
    console.error(error);
    alert("Gagal connect wallet");
  }
};

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
  };

  // Handle play & pay
  const handlePlayAndPay = async (songId) => {
  try {
    const contract = await getWriteContract();
    if (!contract) return;

    const tx = await contract.playSong(songId, {
      value: ethers.parseEther("0.01"),
    });

    alert("Transaksi sedang diproses...");
    await tx.wait();

    alert("Berhasil memutar lagu dan membayar royalti");
    loadSongs();
  } 
    catch (error) {
      console.error("Play error:", error);
      alert("Gagal play & pay");
    }
};

  // Handle detail
  const handleDetail = async (songId) => {
  try {
    const contract = getReadContract();

    const song = await contract.getSong(songId);
    const collaborators = await contract.getCollaborators(songId);

    const collaboratorText = collaborators
      .map(
        (c, index) =>
          `${index + 1}. ${c.wallet} - ${Number(c.percentage)}%`
      )
      .join("\n");

    alert(
      `Judul: ${song[1]}
      Artis: ${song[2]}
      Metadata: ${song[3]}
      Uploader: ${song[4]}
      Play Count: ${Number(song[5])}
      Total Royalty: ${ethers.formatEther(song[6])} ETH

      Kolaborator:
      ${collaboratorText}`
    );
  } 
    catch (error) {
      console.error("Detail error:", error);
      alert("Gagal mengambil detail lagu");
    }
};

  // Format alamat wallet (0x1234...5678)
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const loadSongs = async () => {
  try {
    const contract = getReadContract();

    const data = await contract.getAllSongs();

    const formattedSongs = data.map((song) => ({
      id: Number(song.id),
      title: song.title,
      artist: song.artist,
      metadataURI: song.metadataURI,
      uploader: song.uploader,
      playCount: Number(song.playCount),
      totalRoyalty: ethers.formatEther(song.totalRoyalty),
    }));

    setSongs(formattedSongs);
  } catch (error) {
    console.error("Load songs error:", error);
    alert("Gagal mengambil data lagu dari smart contract");
  }
};

useEffect(() => {
  loadSongs();
}, []);

  return (
    <div className="App">
      {/* Navbar / Header */}
      <header className="navbar">
        <div className="logo">
          <span className="logo-icon">♪</span>
          <span className="logo-text">MusicRoyalty</span>
        </div>
        
        <div className="wallet-section">
          {!account ? (
            <button 
              className="btn-connect" 
              onClick={connectWallet}
            >
              {account
                ? `${account.slice(0, 6)}...${account.slice(-4)}`
                : "Connect Wallet"}
            </button>
          ) : (
            <div className="wallet-info">
              <span className="wallet-address">{formatAddress(account)}</span>
              <button className="btn-disconnect" onClick={disconnectWallet}>Disconnect</button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <h1>Music Royalty Management</h1>
        <p>Transparent, Automated, and Decentralized Music Royalty System on Blockchain</p>
        {!account && (
          <button className="btn-hero" onClick={connectWallet}>
            Get Started
          </button>
        )}
      </section>

      {/* Upload Lagu */}
      <section className="upload-section">
        <h2>Upload Lagu</h2>

        <form onSubmit={handleUploadSong} className="upload-form">
          <input
            type="text"
            placeholder="Judul lagu"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Nama artis"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Metadata URI / IPFS URL"
            value={metadataURI}
            onChange={(e) => setMetadataURI(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Wallet kolaborator"
            value={collaboratorWallet}
            onChange={(e) => setCollaboratorWallet(e.target.value)}
            required
          />

          <input
            type="number"
            placeholder="Persentase royalti, contoh: 100"
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
            required
          />

          <button type="submit">Upload Song</button>
        </form>
      </section>
      <div className="content-area">
        <div className="section-header">
          <h2>Registered Songs</h2>
          <span className="song-count">{songs.length} Songs</span>
        </div>

        <div className="song-grid">
          {songs.map((song) => (
            <div key={song.id} className="song-card">
              <div className="song-header">
                <span className="song-id">#{song.id}</span>
                <span className="song-genre">{song.genre}</span>
              </div>
              <h3 className="song-title">{song.title}</h3>
              <p className="song-artist">{song.artist}</p>
              
              <div className="song-stats">
                <div className="stat">
                  <span className="stat-label">Plays</span>
                  <span className="stat-value">{song.playCount}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Royalty</span>
                  <span className="stat-value">{song.totalRoyalty} ETH</span>
                </div>
              </div>

              <div className="song-actions">
                <button 
                  className="btn-play" 
                  disabled={!account}
                  onClick={() => handlePlayAndPay(song.id, song.title, song.totalRoyalty)}
                >
                  Play & Pay
                </button>
                <button 
                  className="btn-detail"
                  onClick={() => handleDetail(song.id, song.title)}
                >
                  Details
                </button>
                <button 
                  className="btn-detail"
                  onClick={() => handleClaimRoyalty(song.id, song.title)}
                >
                  Claim Royalty
                </button>
              </div>
              {/* <button 
                className="login-warning"
                onClick={() => handleClaimRoyalty(song.id, song.title)}
              >
                Claim Royalty
              </button> */}
              
              {!account && (
                <p className="login-warning">Connect wallet first to play songs</p>
              )}
            </div>
          ))}
        </div>
        
      </div>

      {/* Footer */}
      <footer className="footer">
        <p className="footer-copyright">© 2025 Music Royalty System</p>
        <p className="footer-note">Smart Contract Based Music Royalty Management System</p>
      </footer>
    </div>
  );
}

export default App;