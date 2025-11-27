function MintSection({ account, formData, setFormData, selectedFile, setSelectedFile, status, handleMintRequest }) {
  return (
    <section className="create-section">
      <div className="section-header">
        <h1 className="page-title">Issue Certificate</h1>
        <p className="page-subtitle">Fill in the details to generate standard JSON Metadata</p>
      </div>
      
      <div className="create-container">
        <div className="upload-area">
          <div className="upload-zone">
            <input type="file" id="file-upload" className="file-input-hidden" onChange={(e) => setSelectedFile(e.target.files[0])} />
            <label htmlFor="file-upload" className="upload-label">
              {selectedFile ? (
                <div className="file-preview">
                  <div className="file-name">{selectedFile.name}</div>
                </div>
              ) : (
                <div className="upload-placeholder">Upload Certificate Image</div>
              )}
            </label>
          </div>
        </div>

        <div className="form-panel">
          <div className="form-content">
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
              <div className="input-group">
                <label className="input-label">Student Name</label>
                <input type="text" className="input-field" placeholder="Alice Nguyen"
                  value={formData.studentName} onChange={(e) => setFormData({...formData, studentName: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Certificate Name</label>
                <input type="text" className="input-field" placeholder="Bachelor of Science"
                  value={formData.certName} onChange={(e) => setFormData({...formData, certName: e.target.value})}
                />
              </div>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
              <div className="input-group">
                <label className="input-label">Issuer (University)</label>
                <input type="text" className="input-field" placeholder="ABC University"
                  value={formData.issuerName} onChange={(e) => setFormData({...formData, issuerName: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Program / Major</label>
                <input type="text" className="input-field" placeholder="Computer Science"
                  value={formData.programName} onChange={(e) => setFormData({...formData, programName: e.target.value})}
                />
              </div>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
              <div className="input-group">
                <label className="input-label">Issued At</label>
                <input type="date" className="input-field"
                  value={formData.issuedAt} onChange={(e) => setFormData({...formData, issuedAt: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Verification URL</label>
                <input type="text" className="input-field" placeholder="https://..."
                  value={formData.externalUrl} onChange={(e) => setFormData({...formData, externalUrl: e.target.value})}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Description</label>
              <textarea className="input-field" rows="3" placeholder="Additional details..."
                value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            
            <button className="create-btn" onClick={handleMintRequest} 
              disabled={!account || !formData.studentName || !selectedFile}>
              Mint Standard Certificate
            </button>
            
            {status && <div className="status-alert">{status}</div>}
          </div>
        </div>
      </div>
    </section>
  );
}

export default MintSection;