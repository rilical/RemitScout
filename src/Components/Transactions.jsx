import React, { useContext, useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  Select,
  HStack,
  Icon,
  useToast,
} from "@chakra-ui/react";
import { AuthContext } from "../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import { MdPayment, MdAccessTime } from "react-icons/md";
import { BsCurrencyExchange } from "react-icons/bs";

const Transactions = () => {
  const { isAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("all");

  // Mock transactions data
  useEffect(() => {
    const mockTransactions = [
      {
        id: "1",
        date: "2024-02-20",
        provider: "Wise (TransferWise)",
        amount: 1000,
        fee: 4.99,
        status: "completed",
        recipient: "John Doe",
        destination: "Philippines",
        exchangeRate: 50.25,
      },
      {
        id: "2",
        date: "2024-02-18",
        provider: "Western Union",
        amount: 500,
        fee: 8.00,
        status: "processing",
        recipient: "Jane Smith",
        destination: "Mexico",
        exchangeRate: 17.35,
      },
      {
        id: "3",
        date: "2024-02-15",
        provider: "MoneyGram",
        amount: 750,
        fee: 5.99,
        status: "completed",
        recipient: "Mike Johnson",
        destination: "India",
        exchangeRate: 82.90,
      },
    ];
    setTransactions(mockTransactions);
  }, []);

  if (!isAuth) {
    return (
      <Box bgColor="#f7f9fb" minH="100vh" py={8}>
        <Container maxW="container.xl">
          <Box bg="white" p={8} borderRadius="lg" boxShadow="base" textAlign="center">
            <Heading size="lg" mb={4}>
              Sign in to view your transactions
            </Heading>
            <Text color="gray.600" mb={6}>
              Track all your money transfers in one place
            </Text>
            <Button
              colorScheme="blue"
              size="lg"
              onClick={() => navigate("/signin")}
            >
              Sign In
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  const filteredTransactions = transactions.filter(tx => {
    if (filter === "all") return true;
    return tx.status === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "green";
      case "processing":
        return "yellow";
      case "failed":
        return "red";
      default:
        return "gray";
    }
  };

  return (
    <Box bgColor="#f7f9fb" minH="100vh" py={8}>
      <Container maxW="container.xl">
        {/* Header */}
        <Box bg="white" p={6} borderRadius="lg" boxShadow="base" mb={6}>
          <Stack spacing={4}>
            <Heading size="lg">Transaction History</Heading>
            <Text color="gray.600">
              Track and manage your money transfers
            </Text>
            <HStack>
              <Select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                w="200px"
              >
                <option value="all">All Transactions</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </Select>
            </HStack>
          </Stack>
        </Box>

        {/* Transactions Table */}
        <Box bg="white" borderRadius="lg" boxShadow="base" overflow="hidden">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Date</Th>
                <Th>Provider</Th>
                <Th>Recipient</Th>
                <Th>Destination</Th>
                <Th isNumeric>Amount</Th>
                <Th isNumeric>Fee</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredTransactions.map((tx) => (
                <Tr key={tx.id}>
                  <Td>
                    <HStack>
                      <Icon as={MdAccessTime} color="gray.500" />
                      <Text>{new Date(tx.date).toLocaleDateString()}</Text>
                    </HStack>
                  </Td>
                  <Td>
                    <HStack>
                      <Icon as={MdPayment} color="blue.500" />
                      <Text>{tx.provider}</Text>
                    </HStack>
                  </Td>
                  <Td>{tx.recipient}</Td>
                  <Td>{tx.destination}</Td>
                  <Td isNumeric>
                    <HStack justify="flex-end">
                      <Icon as={BsCurrencyExchange} color="green.500" />
                      <Text>${tx.amount.toFixed(2)}</Text>
                    </HStack>
                  </Td>
                  <Td isNumeric>${tx.fee.toFixed(2)}</Td>
                  <Td>
                    <Badge
                      colorScheme={getStatusColor(tx.status)}
                      textTransform="capitalize"
                    >
                      {tx.status}
                    </Badge>
                  </Td>
                  <Td>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        toast({
                          title: "Receipt downloaded",
                          status: "success",
                          duration: 2000,
                          isClosable: true,
                          position: "top",
                        })
                      }
                    >
                      Receipt
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>

          {filteredTransactions.length === 0 && (
            <Box p={8} textAlign="center">
              <Text color="gray.600">No transactions found</Text>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default Transactions; 