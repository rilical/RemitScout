import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Stack,
  Grid,
  GridItem,
  useToast,
  VStack,
  HStack,
  Divider,
  Image,
  Flex,
} from "@chakra-ui/react";
import { useParams, useNavigate } from "react-router-dom";
import { ProvidersContext } from "../Context/ProvidersContext";
import { AuthContext } from "../Context/AuthContext";

const Payment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { state } = useContext(ProvidersContext);
  const { currentUser } = useContext(AuthContext);
  const [provider, setProvider] = useState(null);
  const [formData, setFormData] = useState({
    senderName: "",
    senderEmail: "",
    recipientName: "",
    recipientPhone: "",
    recipientAddress: "",
    amount: "",
    paymentMethod: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  useEffect(() => {
    const found = state.providers.find((p) => p.id === id);
    if (found) {
      setProvider(found);
      // Pre-fill sender details if user is logged in
      if (currentUser) {
        setFormData(prev => ({
          ...prev,
          senderName: currentUser.firstName + " " + currentUser.lastName,
          senderEmail: currentUser.email,
        }));
      }
    }
  }, [id, state.providers, currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.senderName || !formData.recipientName || !formData.amount || !formData.paymentMethod) {
      toast({
        title: "Please fill all required fields",
        status: "error",
        duration: 2000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    // Simulate payment processing
    toast({
      title: "Processing payment...",
      status: "info",
      duration: 1000,
      isClosable: false,
      position: "top",
    });

    setTimeout(() => {
      toast({
        title: "Transfer initiated successfully!",
        description: "You can track your transfer in the transactions page",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      navigate("/transactions");
    }, 2000);
  };

  if (!provider) {
    return (
      <Box textAlign="center" py={10}>
        <Text>Provider not found</Text>
      </Box>
    );
  }

  return (
    <Box bgColor="#f7f9fb" minH="100vh" py={8}>
      <Container maxW="container.xl">
        {/* Payment Header */}
        <Box bg="white" p={6} borderRadius="lg" boxShadow="base" mb={6}>
          <Flex align="center" gap={6}>
            <Image
              src={provider.images[0]}
              alt={provider.providerName}
              h="40px"
              objectFit="contain"
            />
            <Box>
              <Heading size="md">{provider.providerName}</Heading>
              <Text color="gray.600">Complete your money transfer</Text>
            </Box>
          </Flex>
        </Box>

        <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
          {/* Main Form */}
          <GridItem>
            <Box bg="white" p={6} borderRadius="lg" boxShadow="base">
              <form onSubmit={handleSubmit}>
                <Stack spacing={6}>
                  {/* Sender Details */}
                  <Box>
                    <Heading size="md" mb={4}>
                      Sender Details
                    </Heading>
                    <Stack spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>Full Name</FormLabel>
                        <Input
                          name="senderName"
                          value={formData.senderName}
                          onChange={handleInputChange}
                        />
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel>Email</FormLabel>
                        <Input
                          name="senderEmail"
                          type="email"
                          value={formData.senderEmail}
                          onChange={handleInputChange}
                        />
                      </FormControl>
                    </Stack>
                  </Box>

                  <Divider />

                  {/* Recipient Details */}
                  <Box>
                    <Heading size="md" mb={4}>
                      Recipient Details
                    </Heading>
                    <Stack spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>Full Name</FormLabel>
                        <Input
                          name="recipientName"
                          value={formData.recipientName}
                          onChange={handleInputChange}
                        />
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel>Phone Number</FormLabel>
                        <Input
                          name="recipientPhone"
                          value={formData.recipientPhone}
                          onChange={handleInputChange}
                        />
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel>Address</FormLabel>
                        <Input
                          name="recipientAddress"
                          value={formData.recipientAddress}
                          onChange={handleInputChange}
                        />
                      </FormControl>
                    </Stack>
                  </Box>

                  <Divider />

                  {/* Payment Details */}
                  <Box>
                    <Heading size="md" mb={4}>
                      Payment Details
                    </Heading>
                    <Stack spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>Amount to Send</FormLabel>
                        <Input
                          name="amount"
                          type="number"
                          value={formData.amount}
                          onChange={handleInputChange}
                        />
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel>Payment Method</FormLabel>
                        <Select
                          name="paymentMethod"
                          value={formData.paymentMethod}
                          onChange={handleInputChange}
                        >
                          <option value="">Select payment method</option>
                          <option value="card">Credit/Debit Card</option>
                          <option value="bank">Bank Transfer</option>
                        </Select>
                      </FormControl>

                      {formData.paymentMethod === "card" && (
                        <Stack spacing={4}>
                          <FormControl isRequired>
                            <FormLabel>Card Number</FormLabel>
                            <Input
                              name="cardNumber"
                              value={formData.cardNumber}
                              onChange={handleInputChange}
                              maxLength={16}
                            />
                          </FormControl>
                          <HStack>
                            <FormControl isRequired>
                              <FormLabel>Expiry Date</FormLabel>
                              <Input
                                name="expiryDate"
                                placeholder="MM/YY"
                                value={formData.expiryDate}
                                onChange={handleInputChange}
                              />
                            </FormControl>
                            <FormControl isRequired>
                              <FormLabel>CVV</FormLabel>
                              <Input
                                name="cvv"
                                type="password"
                                maxLength={3}
                                value={formData.cvv}
                                onChange={handleInputChange}
                              />
                            </FormControl>
                          </HStack>
                        </Stack>
                      )}
                    </Stack>
                  </Box>

                  <Button type="submit" colorScheme="blue" size="lg">
                    Send Money
                  </Button>
                </Stack>
              </form>
            </Box>
          </GridItem>

          {/* Summary */}
          <GridItem>
            <Box bg="white" p={6} borderRadius="lg" boxShadow="base">
              <Heading size="md" mb={4}>
                Transfer Summary
              </Heading>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Text color="gray.600">Transfer Amount</Text>
                  <Text fontWeight="bold">
                    ${formData.amount || "0.00"}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color="gray.600">Transfer Fee</Text>
                  <Text fontWeight="bold" color="green.600">
                    ${provider.fee.toFixed(2)}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color="gray.600">Exchange Rate</Text>
                  <Text fontWeight="bold">
                    1 USD = {provider.exchangeRate.toFixed(2)}
                  </Text>
                </HStack>
                <Divider />
                <HStack justify="space-between">
                  <Text color="gray.600">Total Cost</Text>
                  <Text fontSize="xl" fontWeight="bold" color="blue.600">
                    ${formData.amount ? (Number(formData.amount) + provider.fee).toFixed(2) : "0.00"}
                  </Text>
                </HStack>
                <Text fontSize="sm" color="gray.500">
                  Estimated delivery: {provider.estimatedTime}
                </Text>
              </VStack>
            </Box>
          </GridItem>
        </Grid>
      </Container>
    </Box>
  );
};

export default Payment;
