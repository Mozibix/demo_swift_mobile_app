import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import { BankUser, SwiftPayUser } from "@/services/api";
import useDataStore from "@/stores/useDataStore";

interface TransferRecipient {
  swiftPayTag: string;
  recipientName: string;
  amount: string;
  user: SwiftPayUser;
  description: string;
}

type TransferSource = "normal" | "send_to_africa";

interface MultipleTransferContextType {
  recipients: TransferRecipient[];
  bankRecipients: BankUser[];
  transferSource: TransferSource;
  setTransferSource: Dispatch<SetStateAction<TransferSource>>;
  addRecipient: (recipient: TransferRecipient) => void;
  addBankRecipient: (recipient: BankUser) => void;
  removeRecipient: (swiftPayTag: string) => void;
  removeBankRecipient: (account_number: string) => void;
  getTotalAmount: () => number;
  getTotalBankAmount: () => number;
  clearRecipients: () => void;
  clearBankRecipients: () => void;
}

const MultipleTransferContext = createContext<
  MultipleTransferContextType | undefined
>(undefined);

export function MultipleTransferProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [transferSource, setTransferSource] =
    useState<TransferSource>("normal");
  const [recipients, setRecipients] = useState<TransferRecipient[]>([]);
  const [bankRecipients, setBankRecipients] = useState<BankUser[]>([]);
  const getBankTransferData = useDataStore(
    (state) => state.getBankTransferData
  );

  useEffect(() => {
    getBankTransferData();
    clearRecipients();
    clearBankRecipients();
  }, []);

  const addRecipient = (recipient: TransferRecipient) => {
    setRecipients((prev) => [...prev, recipient]);
  };
  const addBankRecipient = (recipient: BankUser) => {
    setBankRecipients((prev) => [...prev, recipient]);
  };

  const removeRecipient = (swiftPayTag: string) => {
    setRecipients((prev) => prev.filter((r) => r.swiftPayTag !== swiftPayTag));
  };

  const removeBankRecipient = (account_number: string) => {
    setBankRecipients((prev) =>
      prev.filter((r) => r.account_number !== account_number)
    );
  };

  const getTotalAmount = () => {
    return recipients.reduce((sum, recipient) => {
      return sum + (parseFloat(recipient.amount) || 0);
    }, 0);
  };

  const getTotalBankAmount = () => {
    return bankRecipients.reduce((sum, recipient) => {
      return sum + (parseFloat(recipient.amount!) || 0);
    }, 0);
  };

  const clearRecipients = () => {
    setRecipients([]);
  };

  const clearBankRecipients = () => {
    setBankRecipients([]);
  };

  return (
    <MultipleTransferContext.Provider
      value={{
        recipients,
        addRecipient,
        removeRecipient,
        getTotalAmount,
        clearRecipients,
        bankRecipients,
        addBankRecipient,
        removeBankRecipient,
        clearBankRecipients,
        getTotalBankAmount,
        transferSource,
        setTransferSource,
      }}
    >
      {children}
    </MultipleTransferContext.Provider>
  );
}

export function useMultipleTransfer() {
  const context = useContext(MultipleTransferContext);
  if (context === undefined) {
    throw new Error(
      "useMultipleTransfer must be used within a MultipleTransferProvider"
    );
  }
  return context;
}
