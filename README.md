# 🚩 Challenge #6 : ZKP - Balance Checker

> ⚠️ **Important:** Please complete **Challenge #5** first if you haven't already, as it contains essential instructions related to all upcoming challenges.

🎫 Build a Balance Checker using Zero-Knowledge Proofs (ZKP) on Arbitrum Stylus:

👷‍♀️ In this challenge, you'll build and deploy a smart contract that utilizes Zero-Knowledge Proofs for private balance verification. You'll work with ZKP circuits, deploy them to an Arbitrum Stylus dev node, and create a frontend that allows users to generate and verify proofs! 🚀

🌟 The final deliverable is a full-stack application featuring balance verification. Deploy your contract to a testnet, then build and upload your app to a public web server.

### How ZKP Integration Works
This project leverages Zero-Knowledge Proofs (ZKPs) to enable private verification of balance on Arbitrum Stylus. Here's the workflow:

1. **Circuit Design**: The ZKP logic is defined in `.circom` files (e.g., `BalanceChecker.circom`) using the Circom language. These circuits encode the rules for verification (e.g., "is balance ≥ 1000 wei?") without revealing the inputs.
2. **Proof System Setup**: We use the `snarkjs` library with the Groth16 proving system to generate proving and verification keys. The trusted setup is simulated using a pre-existing `pot12_final.ptau` file.
3. **Contract Generation**: The verification key is exported to a Solidity contract (e.g., `BalanceChecker.sol`) that runs on Arbitrum Stylus, allowing on-chain verification of zk-proofs.
4. **Frontend Interaction**: The Next.js frontend uses WebAssembly (`.wasm`) outputs from Circom to generate proofs locally, which are then submitted to the deployed contract for verification.
5. **Arbitrum Stylus Advantage**: Stylus' Rust-based environment enables efficient execution of the verifier contract, reducing gas costs compared to traditional EVM-based ZKP verification.

This integration ensures privacy (inputs remain off-chain) and scalability (proof verification is lightweight on-chain).

## Checkpoint 0: 📦 Environment Setup 📚

Before starting, ensure you have the following installed:

- [Node.js (>= v18.17)](https://nodejs.org/en/download/)
- [Yarn](https://classic.yarnpkg.com/en/docs/install/)
- [Git](https://git-scm.com/downloads)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

### Clone the Repository

```bash
git clone -b stylus-zkp-balance-checker https://github.com/abhi152003/speedrun_stylus.git
cd speedrun_stylus
```

## Checkpoint 1: 🚀 Start Your Dev Environment

### Step 1: Start the Nitro Dev Node

1. Navigate to the `cargo-stylus` folder:
   ```bash
   cd packages/cargo-stylus
   ```

2. Run the `run-dev-node.sh` script:
   ```bash
   bash run-dev-node.sh
   ```
   This script:
   - Spins up an Arbitrum Stylus Nitro dev node in Docker.
   - Deploys the `BalanceChecker.sol` contract.
   - Generates the ABI for interacting with the contract.

> The dev node will be accessible at `http://localhost:8547`.

### Step 2: Start the Frontend

> ⚠️ **Before running the frontend:**
> 
>    Go to the `packages/nextjs` directory:
>    ```bash
>    cd packages/nextjs
>    cp .env.example .env
>    ```
>    Open the `.env` file and set:
>    ```env
>    NEXT_PUBLIC_RPC_URL=http://localhost:8547
>    NEXT_PUBLIC_PRIVATE_KEY=your_private_key_of_your_ethereum_wallet
>    ```

Start the development server:
   ```bash
   yarn dev
   ```

> The app will be available at [http://localhost:3000/balanceChecker](http://localhost:3000/balanceChecker).

## Checkpoint 2: 💫 Explore the Features

### Balance Checker

- **Purpose**: Prove that a user's balance exceeds a specified threshold (e.g., ≥ 1000 wei) without revealing the exact balance amount.
- **Circuit Logic**: The `BalanceChecker.circom` circuit takes a private input (user's balance) and a public input (threshold balance). It performs a comparison to check if `balance >= threshold` and outputs a proof if the condition is satisfied.
- **On-Chain Verification**: The generated proof is submitted to `BalanceChecker.sol` deployed on the Arbitrum Stylus dev node. The contract uses the embedded Groth16 verification key to validate the proof against the public threshold, returning `true` if the user's balance meets or exceeds the threshold, all while keeping the balance private.

![Balance Checker Interface](https://github.com/user-attachments/assets/a67edf35-119d-4766-874d-9f92e36c7150)
*Balance verification interface and process flow*

## Checkpoint 3: 🛠 Modify and Deploy Contracts

You can tinker with circuit logic by modifying files in the `packages/circuits` folder. After making changes, regenerate contracts using these commands:

```bash
circom BalanceChecker.circom --r1cs --wasm --sym
npx snarkjs groth16 setup BalanceChecker.r1cs pot12_final.ptau BalanceChecker_0000.zkey
npx snarkjs zkey contribute BalanceChecker_0000.zkey BalanceChecker_final.zkey --name="Contributor" -v
npx snarkjs zkey export verificationkey BalanceChecker_final.zkey verification_key.json
npx snarkjs zkey export solidityverifier BalanceChecker_final.zkey BalanceChecker.sol
```

Deploy new contracts by placing them in `packages/cargo-stylus/contracts` and running:

```bash
bash run-dev-node.sh
```

## 🛠️ Debugging Tips

### Fixing Line Endings for Shell Scripts on Windows (CRLF Issue)

If you encounter errors like `Command not found`, convert line endings to LF:

```bash
sudo apt install dos2unix
dos2unix run-dev-node.sh
chmod +x run-dev-node.sh
```

Run the script again:
```bash
bash run-dev-node.sh
```

## Checkpoint 4: 🚢 Ship your frontend! 🚁

To deploy your app to Vercel:

```bash
vercel
```

Follow Vercel's instructions to get a public URL.

For production deployment:
```bash
vercel --prod
```

## Checkpoint 5: 📜 Contract Verification

You can verify your deployed smart contract using:

```bash
cargo stylus verify -e http://127.0.0.1:8547 --deployment-tx "$deployment_tx"
```

Replace `$deployment_tx` with your deployment transaction hash.

## 🚀 Deploying to Arbitrum Sepolia

If you want to deploy your Balance Checker contract to the Arbitrum Sepolia testnet, follow these steps:

1. **Export your private key in the terminal**
   ```bash
   export PRIVATE_KEY=your_private_key_of_your_ethereum_wallet
   ```

2. **Run the Sepolia Deployment Script**
   ```bash
   cd packages/cargo-stylus/zkp_balance_checker
   bash run-sepolia-deploy.sh
   ```
   This will deploy your contract to Arbitrum Sepolia and output the contract address and transaction hash.

3. **Configure the Frontend for Sepolia**
   - Go to the `packages/nextjs` directory:
     ```bash
     cd packages/nextjs
     cp .env.example .env
     ```
   - Open the `.env` file and set the following variables:
     ```env
     NEXT_PUBLIC_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
     NEXT_PUBLIC_PRIVATE_KEY=your_private_key_of_your_ethereum_wallet
     ```
     Replace `your_private_key_of_your_ethereum_wallet` with your actual Ethereum wallet private key (never share this key publicly).

4. **Start the Frontend**
   ```bash
   yarn run dev
   ```
   Your frontend will now connect to the Arbitrum Sepolia network and interact with your deployed contract.

---

## 🏁 Next Steps

Explore more challenges or contribute to this project!

> 🏃 Head to your next challenge [here](https://speedrunstylus.com/challenge/zkp-password).