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
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [finalBlockNumber, setFinalBlockNumber] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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
    setIsLoading(true);
    setIsSending(true);
    onClose();

    try {
      const response_bundle = await axios.get(
        `${currentConfig.flashbotsRpcUrl}/bundle?id=${uuid}`
      );
      const rawTxs = response_bundle.data.rawTxs || [];

      const response = await axios.post("/api/flashbots", {
        rawData: rawTxs,
        numberOfBlocks: numberOfBlocks,
      });

      if (response.status === 200) {
        console.log("Bundle submitted successfully", response.data);
        setIsSubmitted(true);
        setFinalBlockNumber(numberOfBlocks);
      } else {
        console.error("Error submitting bundle", response.data);
      }
    } catch (error) {
      console.error("Error submitting bundle:", error);
    } finally {
      setIsLoading(false);
      setIsSending(false);
    }
  };

  const TransactionsTable = ({
    transactions,
  }: {
    transactions: Transaction[];
  }) => {
    if (transactions.length === 0) {
      return <p>The transaction sent via RPC with this UUID was not found.</p>;
    }
  
    return (
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
              tx.data.length > 15 ? `${tx.data.substring(0, 15)}...` : tx.data;
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
    );
  };
  
  const SendBundleModal = ({
    isOpen,
    onClose,
    numberOfBlocks,
    setNumberOfBlocks,
    handleSendAction,
  }: {
    isOpen: boolean;
    onClose: () => void;
    numberOfBlocks: number;
    setNumberOfBlocks: (blocks: number) => void;
    handleSendAction: () => void;
  }) => {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Send Bundle</ModalHeader>
          <ModalBody>
            <p>
              The number of blocks you specify here determines how many
              consecutive blocks your transaction bundle will attempt to be
              included in, starting from the current block. Please note, once a
              bundle is included in a block, it will not attempt to be included in
              subsequent blocks.
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
              unsuccessful (the bundle fails to be included). Once initiated, this
              process cannot be canceled, so please review the details carefully
              before sending.
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
    );
  };
  
  const SendingAndConfirmationModals = ({
    isSending,
    isSubmitted,
    numberOfBlocks,
    finalBlockNumber,
    closeModals,
  }: {
    isSending: boolean;
    isSubmitted: boolean;
    numberOfBlocks: number;
    finalBlockNumber: number;
    closeModals: () => void;
  }) => {
    return (
      <Modal isOpen={isSending || isSubmitted} onClose={closeModals}>
        {isSending && !isSubmitted && (
          <ModalContent>
            <ModalHeader>Sending Bundle...</ModalHeader>
            <ModalBody>
              <Spinner label="Sending Bundle..." color="primary" size="lg" />
              <p>
                Your bundle is being sent and will be included in the next{" "}
                {numberOfBlocks} blocks.
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
                be processed until block number {finalBlockNumber}.
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
    );
  };

  return (
    <div>
      <TransactionsTable transactions={transactions} />
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
      <SendingAndConfirmationModals
        isSending={isSending}
        isSubmitted={isSubmitted}
        numberOfBlocks={numberOfBlocks}
        finalBlockNumber={finalBlockNumber}
        closeModals={() => {
          setIsSending(false);
          setIsSubmitted(false);
        }}
      />

      <SendBundleModal
        isOpen={isOpen}
        onClose={onClose}
        numberOfBlocks={numberOfBlocks}
        setNumberOfBlocks={setNumberOfBlocks}
        handleSendAction={handleSendAction}
      />

      <Modal
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
      >
        <ModalContent>
          <ModalHeader>Bundle Submission Complete</ModalHeader>
          <ModalBody>
            Your transaction bundle has been successfully submitted and will be
            attempted until block number {finalBlockNumber}.
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
