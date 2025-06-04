# ZK-Passport Authentication DApp 🛡️

A decentralized application that enables privacy-preserving age verification using Zero-Knowledge proofs and passport data. This project demonstrates how to build a secure authentication system that verifies user credentials without exposing sensitive personal information.

## 🌟 Features

- **Zero-Knowledge Proof Verification**: Verify age credentials without revealing actual passport data
- **Smart Contract Integration**: Ethereum-based authentication with Foundry framework
- **Modern Frontend**: Next.js 15 with React 19 and TypeScript
- **Wallet Integration**: RainbowKit for seamless Web3 wallet connections
- **QR Code Generation**: Generate dynamic QR codes for proof requests
- **Admin Panel**: Administrative interface for managing verifications
- **Responsive UI**: Beautiful, modern interface with Tailwind CSS and shadcn/ui components

## 🏗️ Architecture

```
MinimalDapp/
├── Foundry-Backend/          # Smart contracts and blockchain infrastructure
│   ├── src/
│   │   ├── AuthBluePrint.sol    # Base authentication contract
│   │   └── RandomDApp.sol       # Example DApp implementation
│   ├── lib/                     # Foundry dependencies
│   └── foundry.toml            # Foundry configuration
├── frontend/                    # Next.js React application
│   ├── app/                     # App router pages
│   ├── components/              # React components
│   ├── hooks/                   # Custom React hooks
│   └── contracts/               # Contract ABIs
└── zk-passport-auth/           # ZK proof verification system
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Foundry (for smart contract development)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd MinimalDapp
   ```

2. **Install Foundry dependencies**
   ```bash
   cd Foundry-Backend
   forge install
   forge build
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   pnpm install
   ```

4. **Environment Setup**
   Create a `.env.local` file in the frontend directory:
   ```env
   NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id
   ```

5. **Start local blockchain (optional)**
   ```bash
   cd ../Foundry-Backend
   anvil
   ```

6. **Deploy contracts (if using local blockchain)**
   ```bash
   forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --private-key <your_private_key> --broadcast
   ```

7. **Start the frontend**
   ```bash
   cd ../frontend
   pnpm dev
   ```

Visit `http://localhost:3000` to see the application.

## 🔧 Technology Stack

### Backend (Smart Contracts)
- **Foundry**: Ethereum development framework
- **Solidity**: Smart contract programming language
- **OpenZeppelin**: Security-audited contract libraries

### Frontend
- **Next.js 15**: React framework with App Router
- **React 19**: Latest React with concurrent features
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Beautiful, accessible UI components
- **RainbowKit**: Web3 wallet connection library
- **ethers.js**: Ethereum interaction library
- **Wagmi**: React hooks for Ethereum

### ZK Infrastructure
- **Circuit Verifiers**: Zero-knowledge proof verification
- **QR Code Integration**: Dynamic proof request generation

## 📱 Usage

### For Users

1. **Connect Wallet**: Use the connect button to link your Web3 wallet
2. **Generate QR Code**: Click "Generate QR Code" to create a verification request
3. **Scan with ZK App**: Use a compatible ZK passport app to scan the QR code
4. **Submit Proof**: The app will generate a zero-knowledge proof of your age
5. **Verification**: The proof is verified on-chain without revealing personal data

### For Administrators

1. **Access Admin Panel**: Navigate to `/admin` for the verification dashboard
2. **Review Requests**: See pending verification requests
3. **Verify Proofs**: Validate submitted zero-knowledge proofs
4. **Manage State**: Track verification statuses across the system

## 🔐 Smart Contract Overview

### AuthBluePrint.sol
Base abstract contract providing:
- Authentication state management
- QR code data generation
- Proof validation framework
- Event emission for frontend integration

### RandomDApp.sol
Example implementation demonstrating:
- Custom validation logic
- User status tracking
- Integration with AuthBluePrint

## 🎨 UI Components

The frontend leverages a comprehensive design system:
- **Cards**: Information containers with consistent styling
- **Buttons**: Multiple variants with loading states
- **Forms**: Accessible form controls with validation
- **Dialogs**: Modal interfaces for user interactions
- **Navigation**: Responsive navigation components
- **Themes**: Light/dark mode support

## 🧪 Testing

### Smart Contract Tests
```bash
cd Foundry-Backend
forge test
```

### Frontend Testing
```bash
cd frontend
pnpm test
```

## 🚀 Deployment

### Smart Contracts
Deploy to your preferred network:
```bash
forge script script/Deploy.s.sol --rpc-url <RPC_URL> --private-key <PRIVATE_KEY> --broadcast --verify
```

### Frontend
Deploy to Vercel, Netlify, or your preferred hosting platform:
```bash
pnpm build
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests for smart contracts
- Ensure responsive design for all screen sizes
- Document new features and APIs

## 🔒 Security Considerations

- All smart contracts should undergo security audits before mainnet deployment
- Private keys and sensitive data must never be committed to the repository
- Zero-knowledge proofs ensure privacy while maintaining verifiability
- Regular dependency updates to address security vulnerabilities

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Foundry](https://github.com/foundry-rs/foundry) for the excellent development framework
- [RainbowKit](https://rainbowkit.com/) for wallet integration
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- The Ethereum and ZK communities for advancing privacy-preserving technologies

## 📞 Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Check the [documentation](docs/)
- Join our community discussions

---

**Note**: This is a prototype/research project. Please conduct thorough testing and security audits before using in production environments.
