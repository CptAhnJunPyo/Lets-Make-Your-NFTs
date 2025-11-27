function PortfolioSection({ loading, myNFTs, setActiveTab, handleTransfer, handleRevoke }) {
  return (
    <section className="portfolio-section">
      <div className="section-header">
        <h1 className="page-title">My Certificates</h1>
        <p className="page-subtitle">Manage your blockchain assets</p>
      </div>
      {loading ? (
        <div className="loading-state">
          <div className="spinner-ring"></div>
          <p>Loading from Blockchain...</p>
        </div>
      ) : myNFTs.length === 0 ? (
        <div className="empty-portfolio">
          <div className="upload-icon" style={{fontSize: '3rem', opacity: 0.5}}>📭</div>
          <h3>No certificates found</h3>
          <p>You haven't earned any certificates yet.</p>
          <button className="create-btn" style={{maxWidth: '200px', margin: '20px auto'}} onClick={() => setActiveTab('mint')}>
            Create First NFT
          </button>
        </div>
      ) : (
        <div className="certificates-grid">
          {myNFTs.map((nft, index) => (
            <div key={nft.tokenId || index} className="certificate-card">
              <div className="card-media">
                {nft.image ? (
                   <img 
                     src={nft.image} 
                     alt={nft.name} 
                     className="certificate-image"
                     onError={(e) => {
                       e.target.onerror = null; 
                       e.target.src = "https://via.placeholder.com/400x300?text=No+Image";
                     }}
                   />
                ) : (
                   <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e2e8f0', color: '#64748b'}}>
                      No Image
                   </div>
                )}
                <div className="card-overlay">
                  <span className="token-id">#{nft.tokenId}</span>
                </div>
              </div>
              
              <div className="card-body">
                <h3 className="certificate-name">{nft.name || "Unnamed Certificate"}</h3>
                <p className="certificate-description">
                   {nft.description ? (nft.description.length > 50 ? nft.description.substring(0,50)+"..." : nft.description) : "No description provided."}
                </p>
                
                <div className="card-actions">
                  <button 
                    className="action-button secondary" 
                    onClick={() => handleTransfer(nft.tokenId)}
                    title="Transfer ownership"
                  >
                    Transfer
                  </button>
                  <button 
                    className="action-button danger" 
                    onClick={() => handleRevoke(nft.tokenId)}
                    title="Burn/Delete NFT"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default PortfolioSection;