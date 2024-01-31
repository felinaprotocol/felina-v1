import React, { useState, useEffect } from "react";
import axios from "axios";
import { usePrepareContractWrite, useContractWrite } from "wagmi";
import { Input, Button, Select, SelectItem } from "@nextui-org/react";
import { ethers } from "ethers";
import { currentConfig } from '@config/config';

/**
 * Represents an ABI item.
 * @typedef {Object} AbiItem
 * @property {string} type - Represents the data type of the ABI item.
 * @property {string} stateMutability - Represents the state mutability of the ABI item.
 * @property {string} name - Represents the name of the ABI item.
 * @property {Array<{ type: string, name: string }>} inputs - Represents an array of input parameters for the ABI item.
 */
interface AbiItem {
  type: string;
  stateMutability: string;
  name: string;
  inputs: Array<{
    type: string;
    name: string;
  }>;
}

/**
 * ContractInteractor component for interacting with a smart contract.
 */
const ContractInteractor = () => {
  const [contractAddress, setContractAddress] = useState("");
  const [abi, setAbi] = useState<AbiItem[]>([]);
  const [isAbiLoaded, setIsAbiLoaded] = useState(false);
  const [writeFunctions, setWriteFunctions] = useState<
    Array<{ name: string; inputs: Array<{ type: string; name: string }> }>
  >([]);
  const [selectedFunction, setSelectedFunction] = useState<{
    name: string;
    params: Record<string, string>;
    index: number | null;
  }>({
    name: "",
    params: {},
    index: null,
  });
  const [ethValue, setEthValue] = useState("");
  const isFunctionPayable =
    selectedFunction.name &&
    abi.find(
      (func) =>
        func.name === selectedFunction.name &&
        func.stateMutability === "payable"
    );

  const fetchContractAbi = async () => {
    try {
      const response = await axios.get(currentConfig.etherscanApiUrl, {
        params: {
          module: "contract",
          action: "getabi",
          address: contractAddress,
          apiKey: currentConfig.etherscanApiKey,
        },
      });
      const fetchedAbi = JSON.parse(response.data.result);
      setAbi(fetchedAbi);
      setIsAbiLoaded(true);

      const writeFunctions = fetchedAbi.filter(
        (item: AbiItem) =>
          item.type === "function" &&
          item.stateMutability !== "view" &&
          item.stateMutability !== "pure"
      );
      setWriteFunctions(writeFunctions);
    } catch (error) {
      console.error("Error fetching contract ABI:", error);
    }
  };

  const handleFunctionSelection = (funcName: string, index: number) => {
    const selectedFunc = abi.find((func: AbiItem) => func.name === funcName);
    if (selectedFunc) {
      setSelectedFunction({
        name: selectedFunc.name,
        params: {},
        index,
      });
    }
  };

  const handleParamChange = (paramName: string, value: string) => {
    setSelectedFunction((prevFunction) => ({
      ...prevFunction,
      params: {
        ...prevFunction.params,
        [paramName]: value,
      },
    }));
  };

  const { config: contractWriteConfig } = usePrepareContractWrite({
    address: contractAddress as `0x${string}`,
    abi,
    functionName: selectedFunction.name,
    args: Object.values(selectedFunction.params),
    value: isFunctionPayable
      ? ethValue
        ? BigInt(ethers.utils.parseEther(ethValue).toString())
        : undefined
      : undefined,
  });

  const { write: sendTx, error: writeError } =
    useContractWrite(contractWriteConfig);

  useEffect(() => {
    if (writeError) {
      console.error("Error:", writeError);
    }
  }, [writeError]);

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "auto" }}>
      <div style={{ marginBottom: "10px" }}>
        <label
          style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}
        >
          Contract Address
        </label>
        <Input
          isClearable
          placeholder="Enter Contract Address"
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
          onClear={() => setContractAddress("")}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              fetchContractAbi();
            }
          }}
          style={{ padding: "10px", flex: 1 }}
        />
      </div>
      <Button
        color="primary"
        onClick={fetchContractAbi}
        style={{ marginBottom: "20px" }}
      >
        Fetch Contract Functions
      </Button>

      {isAbiLoaded && (
        <>
          <Select
            placeholder="Select a function"
            aria-label="Select a contract function"
            value={selectedFunction.index ?? undefined}
            onChange={(e) => {
              const index = parseInt(e.target.value, 10);
              handleFunctionSelection(writeFunctions[index].name, index);
            }}
            style={{ marginBottom: "10px" }}
          >
            {writeFunctions.map((func, index) => (
              <SelectItem key={index} value={index}>
                {func.name}
              </SelectItem>
            ))}
          </Select>

          {selectedFunction.name && (
            <div>
              {abi
                .find((func) => func.name === selectedFunction.name)
                ?.inputs.map((input, index) => (
                  <div key={index} style={{ marginBottom: "10px" }}>
                    <Input
                      type="text"
                      label={input.name}
                      placeholder={`${input.type}`}
                      onChange={(e) =>
                        handleParamChange(input.name, e.target.value)
                      }
                    />
                  </div>
                ))}
              {isFunctionPayable && (
                <div style={{ marginBottom: "10px" }}>
                  <Input
                    label="ETH Amount"
                    placeholder="Enter the amount of ETH to send to the contract's payable function."
                    value={ethValue}
                    onChange={(e) => setEthValue(e.target.value)}
                  />
                </div>
              )}
              <Button color="success" onClick={() => sendTx?.()}>
                Send Transaction
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ContractInteractor;
