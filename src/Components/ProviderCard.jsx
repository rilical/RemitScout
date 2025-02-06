import React from "react";
import {
  Box,
  Image,
  Text,
  Button,
  VStack,
  HStack,
  Tooltip,
  Badge,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Divider,
  Link,
  Icon,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import { ExternalLinkIcon, LockIcon, InfoIcon, TimeIcon } from '@chakra-ui/icons';
import { BsShieldCheck } from 'react-icons/bs';

const ProviderCard = ({ provider, searchData }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Helper function to format currency
  const formatCurrency = (amount, currencyCode) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      return `${currencyCode} ${amount.toFixed(2)}`;
    }
  };

  // Get country emoji flag
  const getCountryEmoji = (countryCode) => {
    if (!countryCode) return '🌍';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  };

  // Calculate the amount they'll receive
  const calculateReceivedAmount = () => {
    if (!searchData?.amount) return null;
    const amount = parseFloat(searchData.amount);
    return amount * provider.exchangeRate;
  };

  // Get the total cost including fees
  const getTotalCost = () => {
    if (!searchData?.amount) return null;
    const amount = parseFloat(searchData.amount);
    return amount + provider.fee;
  };

  const handleRedirect = () => {
    window.open(provider.website, '_blank');
    onClose();
  };

  return (
    <>
      <Box
        bg={cardBg}
        p={6}
        borderRadius="xl"
        borderWidth="1px"
        borderColor={borderColor}
        overflow="hidden"
        boxShadow="lg"
        transition="transform 0.2s"
        _hover={{
          transform: 'translateY(-4px)',
          boxShadow: 'xl',
        }}
      >
        {/* Provider Header */}
        <Box borderBottomWidth="1px" borderColor={borderColor} pb={4}>
          <HStack spacing={4} justify="space-between">
            <Image
              src={provider.images[0]}
              alt={provider.providerName}
              h="40px"
              objectFit="contain"
            />
            <Badge
              colorScheme={provider.paymentMode === 'bank' ? 'blue' : 'green'}
              fontSize="sm"
              px={3}
              py={1}
              borderRadius="full"
            >
              {provider.paymentMode === 'bank' ? 'Bank Transfer' : 'Cash Pickup'}
            </Badge>
          </HStack>
        </Box>

        {/* Provider Details */}
        <VStack spacing={4} pt={4} align="stretch">
          {/* Exchange Rate */}
          <HStack justify="space-between">
            <Text color="gray.500">Exchange Rate</Text>
            <Tooltip label="Rate includes provider markup">
              <Text fontWeight="bold">
                1 {searchData?.fromCurrency || 'USD'} = {provider.exchangeRate.toFixed(4)} {searchData?.toCurrency || 'USD'}
              </Text>
            </Tooltip>
          </HStack>

          {/* Transfer Fee */}
          <HStack justify="space-between">
            <Text color="gray.500">Transfer Fee</Text>
            <Text fontWeight="bold">
              {formatCurrency(provider.fee, searchData?.fromCurrency || 'USD')}
            </Text>
          </HStack>

          {/* Amount Received */}
          {searchData && (
            <HStack justify="space-between">
              <Text color="gray.500">They Receive</Text>
              <Text fontWeight="bold" color="green.500">
                {formatCurrency(calculateReceivedAmount(), searchData.toCurrency)}
              </Text>
            </HStack>
          )}

          {/* Total Cost */}
          {searchData && (
            <HStack justify="space-between">
              <Text color="gray.500">Total Cost</Text>
              <Text fontWeight="bold">
                {formatCurrency(getTotalCost(), searchData.fromCurrency)}
              </Text>
            </HStack>
          )}

          {/* Delivery Time */}
          <HStack justify="space-between">
            <Text color="gray.500">Delivery Time</Text>
            <Text fontWeight="bold">{provider.estimatedTime}</Text>
          </HStack>

          {/* Send Money Button */}
          <Button
            colorScheme="blue"
            size="lg"
            onClick={onOpen}
            mt={2}
          >
            Send Money
          </Button>
        </VStack>
      </Box>

      {/* Transfer Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" motionPreset="slideInBottom">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(6px)" />
        <ModalContent borderRadius="xl" mx={4}>
          <ModalHeader borderBottom="1px solid" borderColor="gray.100" pb={4}>
            <HStack spacing={3}>
              <Image
                src={provider.images[0]}
                alt={provider.providerName}
                h="30px"
                objectFit="contain"
              />
              <Text>Transfer Details</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody py={6}>
            <VStack spacing={6} align="stretch">
              {/* Currency Exchange Display */}
              <Box bg="blue.50" p={6} borderRadius="xl">
                <VStack spacing={4}>
                  <HStack spacing={8} justify="center">
                    <VStack>
                      <Text fontSize="2xl" fontWeight="bold">
                        {searchData?.amountFormatted}
                      </Text>
                      <HStack>
                        <Text fontSize="xl">{getCountryEmoji(searchData?.fromCountry)}</Text>
                        <Text>{searchData?.fromCountry}</Text>
                      </HStack>
                    </VStack>
                    <Icon as={ExternalLinkIcon} w={6} h={6} color="blue.500" />
                    <VStack>
                      <Text fontSize="2xl" fontWeight="bold" color="green.500">
                        {formatCurrency(calculateReceivedAmount(), searchData?.toCurrency)}
                      </Text>
                      <HStack>
                        <Text fontSize="xl">{getCountryEmoji(searchData?.toCountry)}</Text>
                        <Text>{searchData?.toCountry}</Text>
                      </HStack>
                    </VStack>
                  </HStack>
                  <Text color="blue.600" fontSize="sm" textAlign="center">
                    Exchange rate: 1 {searchData?.fromCurrency} = {provider.exchangeRate.toFixed(4)} {searchData?.toCurrency}
                  </Text>
                </VStack>
              </Box>

              {/* Transfer Details Grid */}
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <GridItem>
                  <Text color="gray.500">Transfer Fee</Text>
                  <Text fontWeight="bold">{formatCurrency(provider.fee, searchData?.fromCurrency)}</Text>
                </GridItem>
                <GridItem>
                  <Text color="gray.500">Total Cost</Text>
                  <Text fontWeight="bold">{formatCurrency(getTotalCost(), searchData?.fromCurrency)}</Text>
                </GridItem>
                <GridItem>
                  <Text color="gray.500">Payment Method</Text>
                  <Text fontWeight="bold">{provider.paymentMode === 'bank' ? '🏦 Bank Transfer' : '💵 Cash Pickup'}</Text>
                </GridItem>
                <GridItem>
                  <Text color="gray.500">Delivery Time</Text>
                  <Text fontWeight="bold">⏱️ {provider.estimatedTime}</Text>
                </GridItem>
              </Grid>

              <Divider />

              {/* Security Notice */}
              <Box bg="gray.50" p={4} borderRadius="lg">
                <HStack spacing={3} mb={2}>
                  <Icon as={BsShieldCheck} color="green.500" />
                  <Text fontWeight="semibold">Secure Transfer</Text>
                </HStack>
                <Text color="gray.600" fontSize="sm">
                  Your transaction will be processed securely through {provider.providerName}'s platform. 
                  All sensitive data is protected with bank-level encryption.
                </Text>
              </Box>

              {/* Redirect Notice */}
              <Box bg="blue.50" p={4} borderRadius="lg">
                <HStack spacing={3} mb={2}>
                  <InfoIcon color="blue.500" />
                  <Text fontWeight="semibold">Next Steps</Text>
                </HStack>
                <Text color="gray.600" fontSize="sm">
                  You'll be redirected to {provider.providerName}'s website to complete your transfer. 
                  Make sure to review their terms and conditions before proceeding.
                </Text>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter borderTop="1px solid" borderColor="gray.100" pt={4}>
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleRedirect}
              rightIcon={<ExternalLinkIcon />}
            >
              Continue to {provider.providerName}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ProviderCard; 