import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  useDisclosure,
} from "@nextui-org/react";
import { v4 as uuidv4 } from "uuid";
import { currentConfig } from '@config/config';

declare global {
  interface Window {
    ethereum?: any;
  }
}

/**
 * AddNetworkButton component for setting up Flashbots RPC.
 *
 * @return {JSX.Element} The button and modal components for setting up Flashbots RPC.
 */
const AddNetworkButton = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [inputUUID, setInputUUID] = useState("");

  useEffect(() => {
    const storedUUID = localStorage.getItem("flashbotsUUID");
    if (storedUUID) {
      setInputUUID(storedUUID);
    }
  }, [isOpen]);

  const handleUUIDChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setInputUUID(e.target.value);

  const handleResetUUID = () => {
    setInputUUID("");
    localStorage.removeItem("flashbotsUUID");
  };

  const openModal = () => {
    const storedUUID = localStorage.getItem("flashbotsUUID");
    setInputUUID(storedUUID || "");
    onOpen();
  };

  const handleGenerateUUID = () => {
    setInputUUID(uuidv4());
  };

  const handleAddNetwork = async (onClose: () => void) => {
    if (!window.ethereum) {
      alert("Please install MetaMask first.");
      return;
    }

    if (!inputUUID) {
      alert("Please generate a UUID first.");
      return;
    }

    const uuid = inputUUID;
    localStorage.setItem("flashbotsUUID", uuid);
    const flashbotsRpcUrl = `${currentConfig.flashbotsRpcUrl}?bundle=${uuid}`;

    const chainId = process.env.NEXT_PUBLIC_ACTIVE_NETWORK === 'mainnet' ? '0x1' : '0x5';
    const chainName = process.env.NEXT_PUBLIC_ACTIVE_NETWORK === 'mainnet' ? 'Felina bundle simulate RPC' : 'Felina Goerli bundle simulate RPC';
    const blockExplorerUrls = process.env.NEXT_PUBLIC_ACTIVE_NETWORK === 'mainnet' ? ['https://etherscan.io/'] : ['https://goerli.etherscan.io/'];

    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId,
            chainName,
            nativeCurrency: {
              name: "Ethereum",
              symbol: "ETH",
              decimals: 18,
            },
            rpcUrls: [flashbotsRpcUrl],
            blockExplorerUrls,
          },
        ],
      });
    } catch (error) {
      console.error(error);
    } finally {
      onClose();
    }
  };

  return (
    <>
      <Button onPress={openModal} color="primary">
        Flashbots RPC Setup
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Add Flashbots RPC</ModalHeader>
              <ModalBody>
                <Input
                  autoFocus
                  value={inputUUID}
                  onChange={handleUUIDChange}
                  label="UUID"
                  placeholder="Enter a UUID or Generate UUID"
                  variant="bordered"
                />
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="flat" onPress={handleResetUUID}>
                  Reset
                </Button>
                <Button color="primary" onPress={handleGenerateUUID}>
                  Generate UUID
                </Button>
                <Button color="success" onPress={() => handleAddNetwork(onClose)}>
                  Add Flashbots RPC
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default AddNetworkButton;
