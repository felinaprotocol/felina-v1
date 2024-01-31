import React, { useState, useEffect } from "react";
import axios from "axios";
import { ethers } from "ethers";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  useDisclosure,
  Input,
  Spinner,
} from "@nextui-org/react";
import Confetti from "react-confetti";
import { currentConfig } from "@config/config";

interface Transaction {
  from: string;
  to: string;
  value: string;
  data: string;
}

const TransactionsViewer = () => {
  const [uuid, setUuid] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { isOpen, onClose, onOpen } = useDisclosure();
  const [numberOfBlocks, setNumberOfBlocks] = useState(10);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentBlockNumber, setCurrentBlockNumber] = useState(0);

  const fetchTransactions = async () => {
    if (!uuid) return;

    try {
      const response = await axios.get(
        `${currentConfig.flashbotsRpcUrl}/bundle?id=${uuid}`
      );
      const rawTxs = response.data.rawTxs || [];
      const parsedTransactions: Transaction[] = rawTxs.map((tx: string) => {
        const decoded = ethers.utils.parseTransaction(tx);
        return {
          from: decoded.from,
          to: decoded.to,
          value: ethers.utils.formatEther(decoded.value),
          data: decoded.data,
        };
      });
      setTransactions(parsedTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
    }
  };

  useEffect(() => {
    const storedUuid = localStorage.getItem("flashbotsUUID");
    if (storedUuid) {
      setUuid(storedUuid);
    }

    fetchTransactions();
  }, [uuid]);

  const handleSendAction = async () => {
    setIsSending(true);
    onClose();

    try {
      const response_bundle = await axios.get(
        `${currentConfig.flashbotsRpcUrl}/bundle?id=${uuid}`
      );
      const rawTxs = response_bundle.data.rawTxs || [];

      for (let i = 0; i < numberOfBlocks; i++) {
        try {
          const response = await axios.post("/api/flashbots", {
            rawData: rawTxs,
            numberOfBlocks: numberOfBlocks,
          });

          const resolution = response.data;

          const { message, success, blocknumber } = resolution;

          setCurrentBlockNumber(blocknumber);
          if (success) {
            setIsSending(false);
            setIsSubmitted(true);
            break;
          }
        } catch (error) {
          console.error("Error submitting bundle:", error);
        }
      }
    } catch (error) {
      console.error("Error submitting bundle:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div>
      {transactions.length > 0 ? (
        <Table aria-label="Transactions Table">
          <TableHeader>
            <TableColumn>ID #</TableColumn>
            <TableColumn>From</TableColumn>
            <TableColumn>To</TableColumn>
            <TableColumn>Value (ETH)</TableColumn>
            <TableColumn>Data</TableColumn>
          </TableHeader>
          <TableBody>
            {transactions.map((tx, index) => {
              const displayedData =
                tx.data.length > 15
                  ? `${tx.data.substring(0, 15)}...`
                  : tx.data;

              return (
                <TableRow key={index}>
                  <TableCell>{transactions.length - index}</TableCell>
                  <TableCell>{tx.from}</TableCell>
                  <TableCell>{tx.to}</TableCell>
                  <TableCell>{tx.value}</TableCell>
                  <TableCell title={tx.data.length > 15 ? tx.data : ""}>
                    {displayedData}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <p>The transaction sent via RPC with this UUID was not found.</p>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        <Button color="primary" onPress={onOpen}>
          Send Bundle
        </Button>
      </div>

      <Modal
        isOpen={isSending || isSubmitted}
        onClose={() => {
          setIsSending(false);
          setIsSubmitted(false);
        }}
        size="2xl"
        backdrop="blur"
      >
        {isSending && !isSubmitted && (
          <ModalContent>
            <ModalHeader>Transaction Status</ModalHeader>
            <ModalBody>
              {currentBlockNumber && (
                <p>
                  <span style={{ color: "#006FEE", fontWeight: "bold" }}>
                    Block {currentBlockNumber}{" "}
                  </span>
                  Transaction was not included in this block. Attempting in the
                  next block.
                </p>
              )}
              {currentBlockNumber + 1 && (
                <p>
                  <span style={{ color: "#17c964", fontWeight: "bold" }}>
                    Next attempt scheduled for block #{currentBlockNumber + 1}.
                  </span>
                </p>
              )}
              <Spinner />
              <p style={{ color: "#2196F3" }}>
                Note: Flashbots bundles are a way to privately send transactions
                directly to miners, bypassing the public mempool. This reduces
                the risk of front-running and other mempool-based attacks.
              </p>
            </ModalBody>
          </ModalContent>
        )}

        {isSubmitted && (
          <ModalContent>
            <Confetti numberOfPieces={200} />
            <ModalHeader>Bundle Submission Complete</ModalHeader>
            <ModalBody>
              <p style={{ textAlign: "center" }}>
                Your transaction bundle has been successfully submitted and will
                be processed until block number {currentBlockNumber + 1}.
              </p>
            </ModalBody>
            <ModalFooter>
              <Button color="success" onPress={() => setIsSubmitted(false)}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        )}
      </Modal>

      <Modal isOpen={isOpen} onClose={onClose} onOpenChange={onOpen}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Send Bundle</ModalHeader>
          <ModalBody>
            <p>
              The number of blocks you specify here determines how many
              consecutive blocks your transaction bundle will attempt to be
              included in, starting from the current block. Please note, once a
              bundle is included in a block, it will not attempt to be included
              in subsequent blocks.
            </p>
            <Input
              label="Number of Blocks After Current"
              type="number"
              value={numberOfBlocks.toString()}
              onChange={(e) =>
                setNumberOfBlocks(
                  Math.min(100, Math.max(1, parseInt(e.target.value, 10)))
                )
              }
              min={1}
              max={100}
            />
            <p>
              The sent bundle will try to be included in each block on the
              Ethereum network until the specified block number is reached. The
              process can be successful (the bundle is included in a block) or
              unsuccessful (the bundle fails to be included). Once initiated,
              this process cannot be canceled, so please review the details
              carefully before sending.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Close
            </Button>
            <Button color="primary" onPress={handleSendAction}>
              Send Bundle
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
      >
        <ModalContent>
          <ModalHeader>Bundle Submission Complete</ModalHeader>
          <ModalBody>
            Your transaction bundle has been successfully submitted and will be
            attempted until block number {currentBlockNumber + 1}.
          </ModalBody>
          <ModalFooter>
            <Button onPress={() => setIsConfirmationOpen(false)}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default TransactionsViewer;
