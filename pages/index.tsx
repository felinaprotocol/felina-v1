import React, { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import ContractInteractor from "@components/ContractInteractor";
import AddNetworkButton from "@components/AddNetworkButton";
import EthTransfer from "@components/EthTransfer";
import TransactionsViewer from "@components/TransactionViewer";
import { Button } from "@nextui-org/react";

/**
 * Renders the Home component with tabs for sending Ether, contract interaction, and viewing transactions.
 *
 * @return {JSX.Element} The rendered Home component
 */
const Home: NextPage = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("sendEth");
  useEffect(() => setIsMounted(true), []);

  const handleTabChange = (tab: string) => setActiveTab(tab);

  const { isConnected } = useAccount();

  return (
    <div className="page">
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          padding: "10px",
          position: "absolute",
          top: 0,
          right: 0,
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <AddNetworkButton />
          </div>
          <div style={{ marginLeft: "20px" }}>
            <ConnectButton />
          </div>
        </div>
      </div>
      <div
        className="container"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            marginBottom: "20px",
          }}
        >
          <Button
            color={activeTab === "sendEth" ? "primary" : "default"}
            onClick={() => handleTabChange("sendEth")}
          >
            Send Eth
          </Button>
          <Button
            color={activeTab === "contractInteract" ? "primary" : "default"}
            onClick={() => handleTabChange("contractInteract")}
          >
            Contract Integration
          </Button>
          <Button
            color={activeTab === "viewTransactions" ? "primary" : "default"}
            onClick={() => handleTabChange("viewTransactions")}
          >
            View Transactions
          </Button>
        </div>
        <div
          className="content"
          style={{
            width: "100%",
            maxWidth: "600px",
            margin: "0 auto",
            minHeight: "400px",
          }}
        >
          <div style={{ padding: "24px" }}>
            {activeTab === "sendEth" && <h1>Send Eth</h1>}
            {activeTab === "contractInteract" && <h1>Contract Integration</h1>}

            {activeTab === "sendEth" && (
              <EthTransfer isConnected={isConnected} isMounted={isMounted} />
            )}
            {activeTab === "contractInteract" && <ContractInteractor />}
            {activeTab === "viewTransactions" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                }}
              >
                <h1 style={{ width: "100%", textAlign: "center" }}>
                  Transactions
                </h1>
                <div style={{ minWidth: "60%", overflowX: "auto" }}>
                  <TransactionsViewer />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
