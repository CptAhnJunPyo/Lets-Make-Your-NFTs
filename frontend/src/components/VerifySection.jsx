function VerifySection({ verifyFile, setVerifyFile, status, verifyResult, handleVerifyRequest }) {
  return (
    <section className="create-section">
      <div className="section-header">
        <h1 className="page-title">Verify Document</h1>
        <p className="page-subtitle">Check authenticity on Blockchain</p>
      </div>

      <div className="create-container">
         <div className="upload-area">
          <div className="upload-zone">
            <input type="file" id="verify-upload" className="file-input-hidden"
              onChange={(e) => setVerifyFile(e.target.files[0])}
            />
            <label htmlFor="verify-upload" className="upload-label">
              {verifyFile ? (
                <div className="file-preview">
                  <div className="file-icon-large">🔍</div>
                  <div className="file-name">{verifyFile.name}</div>
                </div>
              ) : (
                 <div className="upload-placeholder">
                  <div className="upload-icon">🛡️</div>
                  <div className="upload-text">Upload original file to check</div>
                </div>
              )}
            </label>
          </div>
        </div>

        <div className="form-panel">
           <button className="create-btn" onClick={handleVerifyRequest} disabled={!verifyFile}>
              Verify Integrity
           </button>
           {status && <div className="status-alert" style={{marginTop: 10}}>{status}</div>}
           
           {verifyResult && (
              <div className={`verify-result ${verifyResult.verified ? 'valid' : 'invalid'}`}>
                <h3>{verifyResult.verified ? "VALID DOCUMENT" : " INVALID DOCUMENT"}</h3>
                {verifyResult.verified && (
                  <div className="verify-details">
                    <p><strong>Token ID:</strong> #{verifyResult.tokenId}</p>
                    <p><strong>Owner:</strong> {verifyResult.currentOwner}</p>
                    <p className="ownership-tag">
                      {verifyResult.isYourCert ? " You own this!" : " You do NOT own this."}
                    </p>
                  </div>
                )}
                {!verifyResult.verified && <p>This document does not exist on our system.</p>}
              </div>
           )}
        </div>
      </div>
    </section>
  );
}

export default VerifySection;