import React, { useContext, useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  useColorModeValue,
  Spinner,
  Flex,
  Button,
  Icon,
  keyframes,
} from '@chakra-ui/react';
import { ProvidersContext } from '../Context/ProvidersContext';
import ProviderCard from './ProviderCard';
import Select from 'react-select';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack } from 'react-icons/md';

// Define the sliding animation
const slide = keyframes`
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
`;

// Sample exchange rates data
const exchangeRates = [
  { from: 'USD', to: 'EUR', rate: 0.85, fromFlag: 'US', toFlag: 'EU' },
  { from: 'GBP', to: 'USD', rate: 1.25, fromFlag: 'GB', toFlag: 'US' },
  { from: 'EUR', to: 'JPY', rate: 158.32, fromFlag: 'EU', toFlag: 'JP' },
  { from: 'USD', to: 'CAD', rate: 1.35, fromFlag: 'US', toFlag: 'CA' },
  { from: 'AUD', to: 'USD', rate: 0.65, fromFlag: 'AU', toFlag: 'US' },
  { from: 'USD', to: 'INR', rate: 83.25, fromFlag: 'US', toFlag: 'IN' },
  { from: 'EUR', to: 'GBP', rate: 0.86, fromFlag: 'EU', toFlag: 'GB' },
  { from: 'USD', to: 'CNY', rate: 7.20, fromFlag: 'US', toFlag: 'CN' },
];

const ExchangeRateTicker = ({ searchData }) => {
  const bgColor = useColorModeValue('blue.50', 'blue.900');
  const textColor = useColorModeValue('gray.800', 'white');

  // Get country emoji flag
  const getCountryEmoji = (countryCode) => {
    if (!countryCode) return '🌍';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  };

  // Create exchange rates based on search data if available
  const currentRates = searchData ? [
    { 
      from: searchData.fromCurrency || 'USD', 
      to: searchData.toCurrency || 'EUR',
      rate: searchData.exchangeRate || 1.0,
      fromFlag: searchData.fromCountry || 'US',
      toFlag: searchData.toCountry || 'EU'
    },
    ...exchangeRates
  ] : exchangeRates;

  const slideAnimation = `${slide} 60s linear infinite`;

  const tickerContent = (
    <HStack spacing={12} display="inline-flex">
      {currentRates.map((rate, index) => (
        <HStack
          key={index}
          color={textColor}
          fontSize="lg"
          fontWeight="medium"
          spacing={4}
          h="40px"
          alignItems="center"
        >
          <Text>
            {getCountryEmoji(rate.fromFlag)} {rate.from}
          </Text>
          <Text color="gray.500">→</Text>
          <Text>
            {getCountryEmoji(rate.toFlag)} {rate.to}
          </Text>
          <Text fontWeight="bold" color="green.500">
            {rate.rate.toFixed(2)}
          </Text>
        </HStack>
      ))}
    </HStack>
  );

  return (
    <Box
      w="100%"
      bg={bgColor}
      py={3}
      overflow="hidden"
      position="relative"
      borderBottom="1px"
      borderColor={useColorModeValue('gray.200', 'gray.700')}
      zIndex={2}
    >
      <Box
        display="flex"
        position="relative"
        animation={slideAnimation}
        whiteSpace="nowrap"
      >
        {/* Duplicate the content multiple times for seamless loop */}
        {tickerContent}
        {tickerContent}
        {tickerContent}
        {tickerContent}
      </Box>
    </Box>
  );
};

const ProviderList = () => {
  const navigate = useNavigate();
  const { state } = useContext(ProvidersContext);
  const [sortBy, setSortBy] = useState({ value: 'exchangeRate', label: 'Best Rate 💱' });
  const [filterBy, setFilterBy] = useState({ value: 'all', label: 'All Methods 🌟' });
  const [searchData, setSearchData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Custom styles for react-select
  const customStyles = {
    control: (provided) => ({
      ...provided,
      height: '50px',
      borderRadius: '0.75rem',
      border: '1px solid #E2E8F0',
      boxShadow: 'none',
      backgroundColor: 'white',
      '&:hover': {
        borderColor: '#00b4d8',
        boxShadow: '0 0 0 1px #00b4d8'
      }
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: 'white',
      border: '1px solid #E2E8F0',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      borderRadius: '1rem',
      overflow: 'hidden',
      zIndex: 10
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#00b4d8' : state.isFocused ? '#E6F7FF' : 'white',
      color: state.isSelected ? 'white' : '#2D3748',
      cursor: 'pointer',
      padding: '12px 16px',
      fontSize: '1.1rem',
      '&:hover': {
        backgroundColor: state.isSelected ? '#00b4d8' : '#E6F7FF'
      }
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#A0AEC0',
      fontSize: '1.1rem'
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#2D3748',
      fontSize: '1.1rem'
    }),
    input: (provided) => ({
      ...provided,
      fontSize: '1.1rem'
    }),
    indicatorSeparator: () => ({
      display: 'none'
    }),
    dropdownIndicator: (provided, state) => ({
      ...provided,
      color: state.isFocused ? '#00b4d8' : '#A0AEC0',
      '&:hover': {
        color: '#00b4d8'
      }
    })
  };

  // Sort options
  const sortOptions = [
    { value: 'exchangeRate', label: 'Best Rate 💱' },
    { value: 'fee', label: 'Lowest Fee 💰' },
    { value: 'speed', label: 'Fastest ⚡️' }
  ];

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All Methods 🌟' },
    { value: 'bank', label: 'Bank Transfer 🏦' },
    { value: 'cash', label: 'Cash Pickup 💵' }
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = localStorage.getItem('remitSearch');
        if (data) {
          setSearchData(JSON.parse(data));
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Get country emoji flag
  const getCountryEmoji = (countryCode) => {
    if (!countryCode) return '🌍';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  };

  // Sort providers based on selected criteria
  const sortedProviders = [...(state.providers || [])].sort((a, b) => {
    if (sortBy.value === 'exchangeRate') return b.exchangeRate - a.exchangeRate;
    if (sortBy.value === 'fee') return a.fee - b.fee;
    if (sortBy.value === 'speed') {
      const speedOrder = {
        'Within minutes': 1,
        'Same day': 2,
        '1-2 business days': 3,
        '2-3 business days': 4,
        '3-5 business days': 5,
      };
      return speedOrder[a.estimatedTime] - speedOrder[b.estimatedTime];
    }
    return 0;
  });

  // Filter providers based on selected criteria
  const filteredProviders = sortedProviders.filter(provider => {
    if (filterBy.value === 'all') return true;
    return provider.paymentMode === filterBy.value;
  });

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  if (isLoading) {
    return (
      <Box textAlign="center" py={20}>
        <Spinner size="xl" color="blue.500" thickness="4px" />
        <Text mt={4} fontSize="xl">Loading providers...</Text>
      </Box>
    );
  }

  if (!state.providers || state.providers.length === 0) {
    return (
      <Box textAlign="center" py={20}>
        <Text fontSize="xl" color="gray.600">No providers available at the moment.</Text>
      </Box>
    );
  }

  return (
    <Box position="relative">
      {/* Exchange Rate Ticker */}
      <Box position="sticky" top="0" zIndex={10}>
        <ExchangeRateTicker searchData={searchData} />
      </Box>

      {/* Hero Section with Transfer Details */}
      <Box 
        bg="#00659D"
        py={16}
        position="relative"
        mb={-6}
        _before={{
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "100%",
          bg: "linear-gradient(90deg, rgba(0, 180, 216, 0.05) 0%, rgba(0, 180, 216, 0.1) 50%, rgba(0, 180, 216, 0.05) 100%)",
          zIndex: 0
        }}
      >
        <Container maxW="1800px" position="relative" zIndex={1}>
          {/* Back to Home Button */}
          <Button
            leftIcon={<Icon as={MdArrowBack} w={5} h={5} />}
            onClick={() => navigate('/')}
            position="absolute"
            top={0}
            left={4}
            bg="white"
            color="#00659D"
            size="lg"
            _hover={{
              transform: "translateY(-2px)",
              boxShadow: "lg",
              bg: "gray.50"
            }}
            _active={{
              transform: "translateY(0)",
              bg: "gray.100"
            }}
          >
            Back to Home
          </Button>

          {searchData && (
            <Box
              bg="white"
              p={8}
              borderRadius="2xl"
              boxShadow="2xl"
              maxW="900px"
              mx="auto"
            >
              <Heading size="lg" mb={6} textAlign="center" color="#1A365D">
                Money Transfer Details 💸
              </Heading>
              
              <Flex justify="center" align="center" gap={8}>
                {/* From Amount */}
                <VStack align="center" spacing={2}>
                  <Text fontSize="4xl" fontWeight="bold" color="#00b4d8">
                    {searchData.amountFormatted}
                  </Text>
                  <HStack>
                    <Text fontSize="2xl">{getCountryEmoji(searchData.fromCountry)}</Text>
                    <Text fontSize="lg" color="gray.600" fontWeight="medium">
                      {searchData.fromCountry}
                    </Text>
                  </HStack>
                </VStack>

                {/* Arrow */}
                <Text fontSize="3xl" color="gray.400">→</Text>

                {/* To Amount */}
                <VStack align="center" spacing={2}>
                  <Text fontSize="4xl" fontWeight="bold" color="#00b4d8">
                    {searchData.toCurrency} {(parseFloat(searchData.amount) * (filteredProviders[0]?.exchangeRate || 1)).toFixed(2)}
                  </Text>
                  <HStack>
                    <Text fontSize="2xl">{getCountryEmoji(searchData.toCountry)}</Text>
                    <Text fontSize="lg" color="gray.600" fontWeight="medium">
                      {searchData.toCountry}
                    </Text>
                  </HStack>
                </VStack>
              </Flex>

              {/* USD Equivalent */}
              <Text textAlign="center" mt={4} color="gray.500">
                USD Equivalent: {searchData.amountInUSD} 💱
              </Text>
            </Box>
          )}
        </Container>
      </Box>

      {/* Main Content */}
      <Box 
        bg="white" 
        borderTopRadius="3xl"
        px={8}
        py={16}
        mt={-6}
        position="relative"
        zIndex={1}
      >
        <Container maxW="1800px">
          {/* Filters and Sorting */}
          <HStack mb={8} spacing={4} justify="center">
            <Box w="200px">
              <Select
                value={sortBy}
                onChange={setSortBy}
                options={sortOptions}
                styles={customStyles}
                isSearchable={false}
              />
            </Box>
            
            <Box w="200px">
              <Select
                value={filterBy}
                onChange={setFilterBy}
                options={filterOptions}
                styles={customStyles}
                isSearchable={false}
              />
            </Box>
          </HStack>

          {/* Provider Cards */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
            {filteredProviders.map((provider) => (
              <ProviderCard 
                key={provider.id} 
                provider={provider}
                searchData={searchData}
              />
            ))}
          </SimpleGrid>

          {filteredProviders.length === 0 && (
            <Box textAlign="center" py={10}>
              <Text fontSize="xl">No providers found matching your criteria 🔍</Text>
            </Box>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default ProviderList; 