"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { groth16 } from "snarkjs";

export default function BalanceChecker() {
  const [balance, setBalance] = useState("");
  const [threshold, setThreshold] = useState("");
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
  const [proof, setProof] = useState<any>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Replace with your deployed contract address on Arbitrum Stylus
  const CONTRACT_ADDRESS = "0xda52b25ddB0e3B9CC393b0690Ac62245Ac772527";
  const CONTRACT_ABI = [
    {
      inputs: [
        {
          internalType: "uint256[2]",
          name: "_pA",
          type: "uint256[2]",
        },
        {
          internalType: "uint256[2][2]",
          name: "_pB",
          type: "uint256[2][2]",
        },
        {
          internalType: "uint256[2]",
          name: "_pC",
          type: "uint256[2]",
        },
        {
          internalType: "uint256[1]",
          name: "_pubSignals",
          type: "uint256[1]",
        },
      ],
      name: "verifyProof",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ];

  useEffect(() => {
    loadContract();
  }, []);

  const loadContract = async () => {
    try {
      setError(null);

      // Connect to Arbitrum Stylus dev node
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL || "");
      const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY || "";
      const newSigner = new ethers.Wallet(privateKey, provider);
      setSigner(newSigner);

      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, newSigner);
      setContract(contractInstance);
    } catch (err: any) {
      setError(err.message);
      console.error("Contract loading error:", err);
    }
  };

  const handleBalanceChange = (value: string) => {
    if (value === "" || (/^\d+$/.test(value) && Number(value) >= 0)) {
      setBalance(value);
    }
  };

  const handleThresholdChange = (value: string) => {
    if (value === "" || (/^\d+$/.test(value) && Number(value) >= 0)) {
      setThreshold(value);
    }
  };

  const verifyBalance = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!contract || !signer) {
        throw new Error("Contract or signer not initialized");
      }

      const balanceNumber = Number(balance);
      const thresholdNumber = Number(threshold);

      if (isNaN(balanceNumber) || isNaN(thresholdNumber)) {
        throw new Error("Invalid input values");
      }

      // Generate the proof
      const { proof, publicSignals } = await groth16.fullProve(
        { balance: balanceNumber, threshold: thresholdNumber },
        "/BalanceChecker.wasm",
        "/BalanceChecker_final.zkey",
      );

      // Check if publicSignals contains a valid signal
      const isVerifiedSignal = publicSignals.includes("1");

      // Export calldata for the contract
      const calldata = await groth16.exportSolidityCallData(proof, publicSignals);
      const args = JSON.parse(`[${calldata}]`);

      // Call the contract's verifyProof function
      const result = await contract.verifyProof(args[0], args[1], args[2], args[3]);

      // Combine contract verification with publicSignals check
      const hasSufficientFunds = result && isVerifiedSignal;

      setVerificationResult(hasSufficientFunds);
      setProof(proof);

      console.log("Contract verification result:", result);
      console.log("Circuit output signal check:", isVerifiedSignal);
      console.log("Final verification result:", hasSufficientFunds);
    } catch (err: any) {
      setError(err.message);
      console.error("Verification error:", err);
    } finally {
      setLoading(false);
    }
  };

  const isInputValid = () => balance !== "" && threshold !== "";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-700">Balance Checker</h1>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Balance: <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={balance}
            onChange={e => handleBalanceChange(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="Enter your balance"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Threshold Amount: <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={threshold}
            onChange={e => handleThresholdChange(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="Enter threshold amount"
            required
          />
        </div>

        <button
          onClick={verifyBalance}
          disabled={!isInputValid() || loading}
          className={`w-full p-2 rounded-md transition-colors ${
            isInputValid() && !loading
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {loading ? "Verifying..." : "Verify Balance"}
        </button>

        {error && <div className="mt-4 p-3 rounded-md bg-red-100 text-red-700">{error}</div>}

        {verificationResult !== null && !error && (
          <div
            className={`mt-4 p-3 rounded-md ${verificationResult ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
          >
            {verificationResult
              ? "Verified: Balance is sufficient!"
              : "Verification failed: Insufficient balance or invalid proof!"}
          </div>
        )}

        {proof && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2 text-gray-700">Proof:</h2>
            <pre className="bg-gray-100 text-gray-700 p-2 rounded-md overflow-x-auto text-xs">
              {JSON.stringify(proof, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
