import React, { useState } from "react";
import { usePrepareSendTransaction, useSendTransaction } from "wagmi";
import { ethers } from "ethers";
import { Button, Input, Switch } from "@nextui-org/react";

/**
 * Renders a form for transferring ETH, allowing the user to input recipient address and amount.
 *
 * @param {boolean} isConnected - indicates if the user is connected to the network
 * @param {boolean} isMounted - indicates if the component is mounted in the DOM
 * @return {JSX.Element} the form for transferring ETH
 */
const EthTransfer = ({
  isConnected,
  isMounted,
}: {
  isConnected: boolean;
  isMounted: boolean;
}) => {
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isEth, setIsEth] = useState(true);

  const handleSwitchChange = () => {
    setIsEth(!isEth);
    if (amount) {
      try {
        if (isEth) {
          const weiAmount = ethers.utils.parseUnits(amount, "ether");
          setAmount(weiAmount.toString());
        } else {
          const ethAmount = ethers.utils.formatUnits(amount, "ether");
          setAmount(ethAmount);
        }
      } catch (error) {
        console.error("Covnert error:", error);
      }
    }
  };

  const { config: transferConfig } = usePrepareSendTransaction({
    to: recipientAddress,
    value: isEth
      ? BigInt(ethers.utils.parseEther(amount || "0").toString())
      : ethers.BigNumber.from(amount || "0").toBigInt(),
  });

  const { sendTransaction: sendEthTransfer, isLoading: isTransferLoading } =
    useSendTransaction(transferConfig);

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "auto" }}>
      <div style={{ marginBottom: "10px" }}>
        <label style={{ display: "block", marginBottom: "5px" }}>
          Recipient Address
        </label>
        <Input
          isClearable
          placeholder="Enter Recipient Address"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          onClear={() => {
            setRecipientAddress("");
          }}
        />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "5px",
          }}
        >
          <label>Amount</label>
          <div style={{ display: "flex", alignItems: "center" }}>
            <label style={{ marginRight: "10px" }}>
              {isEth ? "ETH" : "Wei"}
            </label>
            <Switch checked={isEth} onChange={handleSwitchChange} />
          </div>
        </div>
        <Input
          isClearable
          placeholder={`Enter Amount in ${isEth ? "ETH" : "Wei"}`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onClear={() => setAmount("")}
        />
      </div>

      {isMounted && isConnected && (
        <Button
          disabled={!sendEthTransfer || isTransferLoading}
          onClick={() => sendEthTransfer?.()}
          style={{ marginTop: "10px" }}
          isLoading={isTransferLoading}
          color="success"
        >
          Send ETH
        </Button>
      )}
    </div>
  );
};

export default EthTransfer;
