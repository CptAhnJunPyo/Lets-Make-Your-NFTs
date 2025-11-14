
# Certificate as NFT — Extended Design Pack

> Version: 1.0.0 · Date: 2025-10-01 · Owner: You

This pack contains:
- Expanded **UML Class Diagram** (Mermaid)
- **Sequence Diagrams** for Mint / Verify / Revoke
- **ERC‑721 Metadata JSON** example
- **Tech Checklist** for implementation

---

## 1) UML Class Diagram (Mermaid)

```mermaid
classDiagram
direction TB
class User {
    <<Abstract>>
    +String walletAddress
}

class Issuer {
    +String issuerId
    +String name
    +String publicKey
    +bool isActive
    +uploadCertificate(file)
    +provideMetadata(data)
}

class Holder {
    +NFT[] ownedNFTs
    +receiveNFT(nft)
    +provideOriginalFile(tokenId)
}

class Verifier {
    +verifyCertificate(tokenId, originalFile)
}

class CertificateNFT {
    <<SmartContract ERC-721/SBT>>
    +uint256 tokenId
    +address owner
    +string tokenURI
    +bytes32 certificateHash
    +address issuer
    +bool isRevoked

    +mint(to, uri, certificateHash)
    +revoke(tokenId, reason)
    +ownerOf(tokenId)
    +isValid(tokenId) bool
    +setIssuer(address issuer, bool enabled)
}

class BackendAPI {
    <<Service>>
    -IPFSService ipfsService
    -OffchainIndex index
    +handleCertificateUpload(file)
    +computeFileHash(file) bytes32
    +generateMetadata(data) json
    +buildTokenURI(cidJson) string
    +callMintFunction(to, uri, certificateHash)
    +listenToContractEvents()
    +verify(tokenId, originalFile?) VerificationResult
}

class IPFSService {
    <<Helper>>
    +string cid
    +string pinFile(file)
    +string pinJSON(json)
}

class DatabaseCache {
    <<Database>>
    +storeIssuanceRecord(record)
    +getRecordByTokenId(tokenId)
    +getByFileHash(hash)
    +updateFromEvent(event)
}

User <|-- Issuer
User <|-- Holder
User <|-- Verifier

Issuer --|> BackendAPI : interacts with
BackendAPI o-- IPFSService : uses
BackendAPI o-- DatabaseCache : uses
BackendAPI --|> CertificateNFT : calls mint/revoke

Holder "1" -- "0..*" CertificateNFT : owns
Verifier --|> CertificateNFT : queries
Verifier ..> Holder : requests original file
```

---

## 2) Sequence Diagrams

### 2.1 Mint / Issuance
```mermaid
sequenceDiagram
autonumber
participant Issuer
participant Backend as BackendAPI
participant IPFS as IPFSService
participant Chain as CertificateNFT
participant DB as OffchainIndex

Issuer->>Backend: handleCertificateUpload(file, metadataInput)
Backend->>Backend: fileHash = computeFileHash(file) // SHA-256
Backend->>IPFS: pinFile(file)
IPFS-->>Backend: cidFile
Backend->>Backend: json = generateMetadata(metadataInput, fileHash, cidFile)
Backend->>IPFS: pinJSON(json)
IPFS-->>Backend: cidJson
Backend->>Backend: uri = buildTokenURI(cidJson) // ipfs://CIDv1
Backend->>Chain: mint(to, uri, fileHash)
Chain-->>Backend: emit CertificateMinted(tokenId, issuer, to, fileHash, uri)
Backend->>DB: storeIssuanceRecord({tokenId, to, issuer, fileHash, cidFile, cidJson, uri, txHash, block})
```

### 2.2 Verify
```mermaid
sequenceDiagram
autonumber
participant Verifier
participant Backend as BackendAPI
participant Chain as CertificateNFT
participant IPFS as IPFSService

alt Verifier có originalFile
  Verifier->>Backend: verify(tokenId, originalFile)
  Backend->>Backend: fileHash' = computeFileHash(originalFile)
else Verifier chỉ có tokenId
  Verifier->>Chain: tokenURI(tokenId)
  Chain-->>Verifier: ipfs://cidJson
  Verifier->>IPFS: GET cidJson -> lấy file_cid
  Verifier->>IPFS: GET file_cid -> originalFile
  Verifier->>Backend: verify(tokenId, originalFile)
  Backend->>Backend: fileHash' = computeFileHash(originalFile)
end
Backend->>Chain: read certificateHash, isRevoked, ownerOf, issuer
Chain-->>Backend: on-chain data
Backend-->>Verifier: result = (fileHash'==certificateHash && !isRevoked)
```

### 2.3 Revoke
```mermaid
sequenceDiagram
autonumber
participant Issuer
participant Chain as CertificateNFT
participant Backend as BackendAPI
participant DB as OffchainIndex

Issuer->>Chain: revoke(tokenId, reason)
Chain-->>Backend: emit CertificateRevoked(tokenId, issuer, reason)
Backend->>DB: updateFromEvent(revoked=true, reason, revokedAt, txHash, block)
Backend-->>Issuer: ack (synced)
```

---

## 3) ERC‑721 Metadata JSON (Example)

```json
{
  "name": "Bachelor of Science - Alice Nguyen",
  "description": "Verifiable certificate issued by ABC University.",
  "image": "ipfs://bafy.../preview.png",
  "external_url": "https://verify.example.org/cert/12345",
  "attributes": [
    { "trait_type": "issuer_name", "value": "ABC University" },
    { "trait_type": "program", "value": "Computer Science" },
    { "trait_type": "issued_at", "value": "2025-09-20T00:00:00Z" },
    { "trait_type": "expires_at", "value": "" },
    { "trait_type": "chain_id", "value": 42161 },
    { "trait_type": "policy", "value": "non-transferable" }
  ],
  "certificate_hash": "0x1f3a...abcd",
  "file_cid": "bafybeigdyr...xyz",
  "issuer": "0xIssuerAddress",
  "schema_version": "1.0.0"
}
```

---

## 4) Technical Checklist

- [ ] File hash normalized (**SHA‑256**) and written **on‑chain**.
- [ ] `ipfs://CIDv1` URIs; metadata compliant with **ERC‑721**.
- [ ] Event‑driven indexing (`CertificateMinted`, `CertificateRevoked`) + reorg handling.
- [ ] Role‑based control in contract (**AccessControl / ISSUER_ROLE**).
- [ ] Transfer policy: **SBT** (ERC‑5192/5484) for personal certificates.
- [ ] No raw PII on chain/metadata; hash/anonymize where necessary.
- [ ] Verify = hash match + not revoked + trusted issuer.
- [ ] Reissue / wallet recovery plan (burn + remint per policy).
```

