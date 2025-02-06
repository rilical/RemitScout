import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Input,
  Button,
  useToast,
  Stack,
  Image,
  Grid,
  GridItem,
  InputGroup,
  InputRightElement,
  useColorModeValue,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Link,
  Menu,
  MenuButton,
  ChevronDownIcon,
  keyframes,
  usePrefersReducedMotion,
  VStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { MdSearch } from "react-icons/md";
import { BsCurrencyExchange, BsLightning, BsShieldCheck } from "react-icons/bs";
import { FaGlobeAmericas } from "react-icons/fa";
import { BiTrendingUp } from "react-icons/bi";
import Select from 'react-select';

const brandLogos = [
  {
    name: "MoneyGram",
    src: "/logos/MONEYGRAM.webp",
  },
  {
    name: "Remitly",
    src: "/logos/Remitly_idC-entTwe_0.svg",
  },
  {
    name: "Wise",
    src: "/logos/Wise_Symbol_0.svg",
  },
  {
    name: "WesternUnion",
    src: "/logos/free-western-union-logo-icon-19537-thumb-2.png",
  },
  {
    name: "WorldRemit",
    src: "/logos/WorldRemit_logo.svg.png",
  },
  {
    name: "XE",
    src: "/logos/Xe-logo.png",
  },
];

function Home() {
  const [fromCountry, setFromCountry] = useState("");
  const [toCountry, setToCountry] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [email, setEmail] = useState("");
  const toast = useToast();
  const navigate = useNavigate();
  const prefersReducedMotion = usePrefersReducedMotion();
  
  // Modern color scheme
  const bgGradient = "linear(to-r, #0f172a, #1e3a8a)"; // Deeper tech blue gradient
  const cardBg = useColorModeValue("white", "gray.800");
  const buttonGradient = "#00b4d8"; // Solid blue color

  // Currency mapping
  const countryCurrencyMap = {
    'US': { code: 'USD', symbol: '$' },
    'CA': { code: 'CAD', symbol: 'C$' },
    'MX': { code: 'MXN', symbol: 'Mex$' },
    
    // Central America & Caribbean
    'HN': { code: 'HNL', symbol: 'L' },
    'GT': { code: 'GTQ', symbol: 'Q' },
    'DO': { code: 'DOP', symbol: 'RD$' },
    'SV': { code: 'USD', symbol: '$' },
    'CR': { code: 'CRC', symbol: '₡' },
    'JM': { code: 'JMD', symbol: 'J$' },
    'TT': { code: 'TTD', symbol: 'TT$' },
    
    // South America
    'CO': { code: 'COP', symbol: 'Col$' },
    'PE': { code: 'PEN', symbol: 'S/' },
    'EC': { code: 'USD', symbol: '$' },
    'BO': { code: 'BOB', symbol: 'Bs.' },
    'PY': { code: 'PYG', symbol: '₲' },
    'AR': { code: 'ARS', symbol: 'AR$' },
    
    // Europe
    'GB': { code: 'GBP', symbol: '£' },
    'FR': { code: 'EUR', symbol: '€' },
    'DE': { code: 'EUR', symbol: '€' },
    'PL': { code: 'PLN', symbol: 'zł' },
    'UA': { code: 'UAH', symbol: '₴' },
    'RO': { code: 'RON', symbol: 'lei' },
    'TR': { code: 'TRY', symbol: '₺' },
    'RU': { code: 'RUB', symbol: '₽' },
    
    // Middle East
    'AE': { code: 'AED', symbol: 'د.إ' },
    'SA': { code: 'SAR', symbol: '﷼' },
    'QA': { code: 'QAR', symbol: 'ر.ق' },
    'KW': { code: 'KWD', symbol: 'د.ك' },
    'JO': { code: 'JOD', symbol: 'JD' },
    'IL': { code: 'ILS', symbol: '₪' },
    'LB': { code: 'LBP', symbol: 'L£' },
    
    // Asia
    'IN': { code: 'INR', symbol: '₹' },
    'CN': { code: 'CNY', symbol: '¥' },
    'PH': { code: 'PHP', symbol: '₱' },
    'PK': { code: 'PKR', symbol: '₨' },
    'BD': { code: 'BDT', symbol: '৳' },
    'VN': { code: 'VND', symbol: '₫' },
    'KR': { code: 'KRW', symbol: '₩' },
    'LK': { code: 'LKR', symbol: 'Rs' },
    'NP': { code: 'NPR', symbol: 'रू' },
    'ID': { code: 'IDR', symbol: 'Rp' },
    'MM': { code: 'MMK', symbol: 'K' },
    
    // Africa
    'EG': { code: 'EGP', symbol: 'E£' },
    'NG': { code: 'NGN', symbol: '₦' },
    'GH': { code: 'GHS', symbol: 'GH₵' },
    'KE': { code: 'KES', symbol: 'KSh' },
    'DZ': { code: 'DZD', symbol: 'دج' },
    'MA': { code: 'MAD', symbol: 'MAD' },
    
    // Oceania
    'AU': { code: 'AUD', symbol: 'A$' },
    
    // Default fallback
    'default': { code: 'USD', symbol: '$' }
  };

  // Conversion rates to USD (1 unit of currency = X USD)
  const conversionRates = {
    // Base currency: USD = 1
    'USD': 1,
    // North America
    'CAD': 0.74,
    'MXN': 0.059,
    
    // Central America & Caribbean
    'HNL': 0.041,
    'GTQ': 0.128,
    'DOP': 0.017,
    'CRC': 0.0019,
    'JMD': 0.0065,
    'TTD': 0.148,
    
    // South America
    'COP': 0.00025,
    'PEN': 0.27,
    'BOB': 0.145,
    'PYG': 0.00014,
    'ARS': 0.0012,
    
    // Europe
    'GBP': 1.27,
    'EUR': 1.08,
    'PLN': 0.25,
    'UAH': 0.026,
    'RON': 0.22,
    'TRY': 0.031,
    'RUB': 0.011,
    
    // Middle East
    'AED': 0.27,
    'SAR': 0.27,
    'QAR': 0.27,
    'KWD': 3.25,
    'JOD': 1.41,
    'ILS': 0.27,
    'LBP': 0.000011,
    
    // Asia
    'INR': 0.012,
    'CNY': 0.14,
    'PHP': 0.018,
    'PKR': 0.0036,
    'BDT': 0.0091,
    'VND': 0.000041,
    'KRW': 0.00076,
    'LKR': 0.0031,
    'NPR': 0.0075,
    'IDR': 0.000064,
    'MMK': 0.00048,
    
    // Africa
    'EGP': 0.032,
    'NGN': 0.0011,
    'GHS': 0.083,
    'KES': 0.0064,
    'DZD': 0.0074,
    'MAD': 0.099,
    
    // Oceania
    'AUD': 0.66,
    
    // Default fallback
    'default': 1
  };

  // Helper function to format currency with proper locale
  const formatCurrency = (amount, currencyCode) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      // Fallback formatting if currency code is not supported
      return `${countryCurrencyMap[currencyCode]?.symbol || '$'}${parseFloat(amount).toFixed(2)}`;
    }
  };

  // Update currency when fromCountry changes
  useEffect(() => {
    if (fromCountry) {
      const newCurrency = countryCurrencyMap[fromCountry]?.code || 'USD';
      setCurrency(newCurrency);
    }
  }, [fromCountry]);

  // Update the countries list with all supported countries
  const countries = [
    // North America
    { value: "US", label: "🇺🇸 United States", region: "North America" },
    { value: "CA", label: "🇨🇦 Canada", region: "North America" },
    { value: "MX", label: "🇲🇽 Mexico", region: "North America" },
    
    // Central America & Caribbean
    { value: "HN", label: "🇭🇳 Honduras", region: "Central America" },
    { value: "GT", label: "🇬🇹 Guatemala", region: "Central America" },
    { value: "DO", label: "🇩🇴 Dominican Republic", region: "Caribbean" },
    { value: "SV", label: "🇸🇻 El Salvador", region: "Central America" },
    { value: "CR", label: "🇨🇷 Costa Rica", region: "Central America" },
    { value: "JM", label: "🇯🇲 Jamaica", region: "Caribbean" },
    { value: "TT", label: "🇹🇹 Trinidad and Tobago", region: "Caribbean" },
    
    // South America
    { value: "CO", label: "🇨🇴 Colombia", region: "South America" },
    { value: "PE", label: "🇵🇪 Peru", region: "South America" },
    { value: "EC", label: "🇪🇨 Ecuador", region: "South America" },
    { value: "BO", label: "🇧🇴 Bolivia", region: "South America" },
    { value: "PY", label: "🇵🇾 Paraguay", region: "South America" },
    { value: "AR", label: "🇦🇷 Argentina", region: "South America" },
    
    // Europe
    { value: "GB", label: "🇬🇧 United Kingdom", region: "Europe" },
    { value: "FR", label: "🇫🇷 France", region: "Europe" },
    { value: "DE", label: "🇩🇪 Germany", region: "Europe" },
    { value: "PL", label: "🇵🇱 Poland", region: "Europe" },
    { value: "UA", label: "🇺🇦 Ukraine", region: "Europe" },
    { value: "RO", label: "🇷🇴 Romania", region: "Europe" },
    { value: "TR", label: "🇹🇷 Turkey", region: "Europe" },
    { value: "RU", label: "🇷🇺 Russia", region: "Europe" },
    
    // Middle East
    { value: "AE", label: "🇦🇪 United Arab Emirates", region: "Middle East" },
    { value: "SA", label: "🇸🇦 Saudi Arabia", region: "Middle East" },
    { value: "QA", label: "🇶🇦 Qatar", region: "Middle East" },
    { value: "KW", label: "🇰🇼 Kuwait", region: "Middle East" },
    { value: "JO", label: "🇯🇴 Jordan", region: "Middle East" },
    { value: "IL", label: "🇮🇱 Israel", region: "Middle East" },
    { value: "LB", label: "🇱🇧 Lebanon", region: "Middle East" },
    
    // Asia
    { value: "IN", label: "🇮🇳 India", region: "Asia" },
    { value: "CN", label: "🇨🇳 China", region: "Asia" },
    { value: "PH", label: "🇵🇭 Philippines", region: "Asia" },
    { value: "PK", label: "🇵🇰 Pakistan", region: "Asia" },
    { value: "BD", label: "🇧🇩 Bangladesh", region: "Asia" },
    { value: "VN", label: "🇻🇳 Vietnam", region: "Asia" },
    { value: "KR", label: "🇰🇷 South Korea", region: "Asia" },
    { value: "LK", label: "🇱🇰 Sri Lanka", region: "Asia" },
    { value: "NP", label: "🇳🇵 Nepal", region: "Asia" },
    { value: "ID", label: "🇮🇩 Indonesia", region: "Asia" },
    { value: "MM", label: "🇲🇲 Myanmar", region: "Asia" },
    
    // Africa
    { value: "EG", label: "🇪🇬 Egypt", region: "Africa" },
    { value: "NG", label: "🇳🇬 Nigeria", region: "Africa" },
    { value: "GH", label: "🇬🇭 Ghana", region: "Africa" },
    { value: "KE", label: "🇰🇪 Kenya", region: "Africa" },
    { value: "DZ", label: "🇩🇿 Algeria", region: "Africa" },
    { value: "MA", label: "🇲🇦 Morocco", region: "Africa" },
    
    // Oceania
    { value: "AU", label: "🇦🇺 Australia", region: "Oceania" }
  ];

  // Group countries by region for the dropdown
  const groupedCountries = countries.reduce((acc, country) => {
    if (!acc[country.region]) {
      acc[country.region] = [];
    }
    acc[country.region].push(country);
    return acc;
  }, {});

  // Convert grouped countries to format required by react-select
  const groupedOptions = Object.keys(groupedCountries).map(region => ({
    label: region,
    options: groupedCountries[region]
  }));

  // Update custom styles to support grouping
  const customStyles = {
    control: (provided) => ({
      ...provided,
      height: '85px',
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
    group: (provided) => ({
      ...provided,
      padding: 0,
      margin: 0,
      '&:not(:last-child)': {
        borderBottom: '1px solid #E2E8F0'
      }
    }),
    groupHeading: (provided) => ({
      ...provided,
      fontSize: '0.9rem',
      color: '#4A5568',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      backgroundColor: '#F7FAFC',
      padding: '8px 12px',
      margin: 0
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

  // Modify handleFromCountryChange to handle clearing better
  const handleFromCountryChange = (option) => {
    if (option?.value === fromCountry) {
      return; // Prevent reselecting the same country
    }
    
    setFromCountry(option?.value || "");
    setAmount(""); // Clear amount when source country changes
    
    // Update currency based on selected country or reset to USD
    if (option?.value) {
      const newCurrency = countryCurrencyMap[option.value]?.code || 'USD';
      setCurrency(newCurrency);
    } else {
      setCurrency('USD');
    }

    // Clear destination if it matches new source
    if (option?.value === toCountry) {
      setToCountry('');
    }
  };

  // Modify handleToCountryChange to handle clearing better
  const handleToCountryChange = (option) => {
    if (option?.value === fromCountry) {
      return; // Prevent selecting same as source country
    }
    setToCountry(option?.value || "");
    setAmount(""); // Clear amount when destination changes
  };

  // Update the amount input styles based on state
  const getAmountInputStyles = () => ({
    ...(!fromCountry || !toCountry ? {
      bg: "gray.50",
      cursor: "not-allowed",
      opacity: 0.7,
      _hover: { borderColor: "gray.200" },
      _focus: { borderColor: "gray.200" }
    } : {
      bg: "white",
      _hover: { borderColor: "#00b4d8" },
      _focus: {
        borderColor: "#00b4d8",
        boxShadow: "0 0 0 2px rgba(0, 180, 216, 0.2)"
      }
    })
  });

  // Get available destination countries (excluding source country)
  const getAvailableDestinations = () => {
    if (!fromCountry) return [];
    
    return groupedOptions.map(group => ({
      ...group,
      options: group.options.filter(country => country.value !== fromCountry)
    })).filter(group => group.options.length > 0);
  };

  // Update getUSDEquivalent to use the new formatting
  const getUSDEquivalent = () => {
    if (!amount || !currency) return null;
    
    const rate = conversionRates[currency] || conversionRates.default;
    const usdAmount = amount * rate;
    
    if (currency === 'USD') return null;
    
    return `≈ ${formatCurrency(usdAmount, 'USD')}`;
  };

  // Update handleAmountChange to use new conversion rates
  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      let amountInUSD = value;
      
      // Convert to USD if not already in USD
      if (currency !== 'USD') {
        const rate = conversionRates[currency] || conversionRates.default;
        amountInUSD = value * rate;
      }

      // Check if amount exceeds 10K USD
      if (amountInUSD > 10000) {
        toast({
          title: "Amount Exceeds Limit",
          description: `Maximum transfer amount is ${formatCurrency(10000, 'USD')}`,
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "top",
        });
        return;
      }

      setAmount(value);
    }
  };

  // Update handleCompare to include formatted amounts
  const handleCompare = () => {
    if (!fromCountry || !toCountry || !amount) {
      toast({
        title: "Please fill all fields",
        status: "error",
        duration: 2000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    const fromCurrency = countryCurrencyMap[fromCountry]?.code || 'USD';
    const toCurrency = countryCurrencyMap[toCountry]?.code || 'USD';
    
    const searchData = { 
      fromCountry, 
      toCountry, 
      amount: parseFloat(amount),
      currency: fromCurrency,
      fromCurrency,
      toCurrency,
      amountFormatted: formatCurrency(amount, fromCurrency),
      amountInUSD: formatCurrency(amount * (conversionRates[fromCurrency] || 1), 'USD')
    };
    
    localStorage.setItem("remitSearch", JSON.stringify(searchData));
    navigate("/providers");
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    // Example: Send email to your mail service or API
    toast({
      title: "Subscribed!",
      description: "You've been subscribed to our newsletter.",
      status: "success",
      duration: 3000,
      isClosable: true,
      position: "top",
    });
    setEmail("");
  };

  const features = [
    {
      icon: BsCurrencyExchange,
      emoji: "💱",
      title: "Best Exchange Rates",
      description: "Compare rates from multiple providers",
      gradient: "linear(to-r, green.400, teal.500)",
    },
    {
      icon: BsLightning,
      emoji: "⚡️",
      title: "Instant Transfers",
      description: "Send money in minutes",
      gradient: "linear(to-r, yellow.400, orange.500)",
    },
    {
      icon: BsShieldCheck,
      emoji: "🔒",
      title: "Bank-Level Security",
      description: "Licensed and regulated providers",
      gradient: "linear(to-r, blue.400, cyan.500)",
    },
    {
      icon: FaGlobeAmericas,
      emoji: "🌎",
      title: "Global Coverage",
      description: "Send to 200+ countries",
      gradient: "linear(to-r, purple.400, pink.500)",
    },
    {
      icon: BiTrendingUp,
      emoji: "📈",
      title: "Real-Time Rates",
      description: "Always get the latest rates",
      gradient: "linear(to-r, red.400, orange.500)",
    },
  ];

  const scrollX = keyframes`
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  `;

  const animation = prefersReducedMotion
    ? undefined
    : `${scrollX} 30s linear infinite`;

  return (
    <Box 
      bgColor="white"
      minH="100vh"
      pb={40}
    >
      <Box
        bg="#00659D"
        py={20}
        position="relative"
        overflow="hidden"
      >
        <Container maxW="1800px">
          {/* Hero Section */}
          <Box textAlign="center" position="relative" zIndex={1} mb={6}>
            <Heading
              size="4xl"
              mb={4}
              color="white"
              letterSpacing="tight"
              fontWeight="extrabold"
              fontSize="5xl"
              textShadow="none"
              lineHeight="1"
              mx="auto"
              maxW="1200px"
              whiteSpace="nowrap"
            >
              Find the Smartest Way to Send Money 🔍
            </Heading>
            <Text 
              fontSize="2xl"
              mb={8}
              color="white"
              opacity={0.9}
              fontWeight="bold"
              textShadow="none"
              lineHeight="1.2"
              mx="auto"
              maxW="700px"
            >
              Compare providers, exchange rates, and fees instantly.
            </Text>

            {/* Search Box */}
            <Box
              maxW="90%"
              mx="auto"
              bg="white"
              borderRadius="2xl"
              boxShadow="2xl"
              p={{ base: 6, md: 12 }}
              border="1px solid"
              borderColor="gray.100"
              position="relative"
              transform="translateY(0)"
              transition="transform 0.2s"
              _hover={{
                transform: "translateY(-2px)"
              }}
              _before={{
                content: '""',
                position: "absolute",
                top: "-10px",
                left: "-10px",
                right: "-10px",
                bottom: "-10px",
                bg: "rgba(255, 255, 255, 0.1)",
                opacity: 0.05,
                borderRadius: "3xl",
                zIndex: -1
              }}
            >
              <Stack spacing={6}>
                {/* Amount Input First */}
                <Flex gap={6} direction={{ base: "column", md: "row" }}>
                  <InputGroup size="lg" flex="1">
                    <Input
                      placeholder={!fromCountry || !toCountry ? "Select countries first 🌍" : "Amount to Send 💰"}
                      type="text"
                      inputMode="decimal"
                      value={amount}
                      onChange={handleAmountChange}
                      h="85px"
                      fontSize="2xl"
                      borderRadius="xl"
                      pr="100px"
                      color="#2D3748"
                      borderColor="gray.200"
                      isDisabled={!fromCountry || !toCountry}
                      _placeholder={{ 
                        color: !fromCountry || !toCountry ? 'gray.400' : 'gray.500'
                      }}
                      {...getAmountInputStyles()}
                    />
                    <InputRightElement width="100px" h="85px" pr={4}>
                      <Text 
                        fontSize="xl" 
                        color={!fromCountry ? "gray.400" : "gray.600"} 
                        fontWeight="medium" 
                        whiteSpace="nowrap"
                      >
                        {countryCurrencyMap[fromCountry]?.symbol || '$'} {currency}
                      </Text>
                    </InputRightElement>
                  </InputGroup>
                </Flex>

                {/* Show USD equivalent if not in USD */}
                {getUSDEquivalent() && fromCountry && toCountry && (
                  <Text 
                    mt={2} 
                    color="gray.500" 
                    fontSize="md"
                    textAlign="left"
                  >
                    {getUSDEquivalent()}
                  </Text>
                )}

                {/* Country Selectors Below */}
                <Flex 
                  gap={6} 
                  direction={{ base: "column", md: "row" }}
                >
                  <Box flex="1">
                    <Select
                      placeholder="Sending From 🌍"
                      value={countries.find(c => c.value === fromCountry)}
                      onChange={handleFromCountryChange}
                      options={groupedOptions}
                      styles={customStyles}
                      isSearchable
                      isClearable
                    />
                  </Box>

                  <Box flex="1">
                    <Select
                      placeholder="Sending To 📍"
                      value={countries.find(c => c.value === toCountry)}
                      onChange={handleToCountryChange}
                      options={getAvailableDestinations()}
                      styles={{
                        ...customStyles,
                        control: (provided, state) => ({
                          ...customStyles.control(provided, state),
                          backgroundColor: !fromCountry ? 'gray.50' : 'white',
                          opacity: !fromCountry ? 0.7 : 1
                        })
                      }}
                      isSearchable
                      isDisabled={!fromCountry}
                      isClearable
                    />
                  </Box>
                </Flex>

                <Flex justify="center" mt={4}>
                  <Button
                    size="lg"
                    bg="#00b4d8"
                    color="white"
                    w={{ base: "full", md: "400px" }}
                    h="85px"
                    fontSize="2xl"
                    _hover={{
                      bg: "#0077b6",
                      transform: "translateY(-2px)",
                      boxShadow: "lg"
                    }}
                    _active={{
                      bg: "#0077b6",
                      transform: "translateY(0)",
                    }}
                    onClick={handleCompare}
                    leftIcon={<MdSearch size={28} />}
                    fontWeight="bold"
                    borderRadius="xl"
                    transition="all 0.2s"
                    isDisabled={!fromCountry || !toCountry || !amount}
                    _disabled={{
                      bg: "gray.300",
                      cursor: "not-allowed",
                      _hover: {
                        bg: "gray.300",
                        transform: "none",
                        boxShadow: "none"
                      }
                    }}
                  >
                    Compare Rates
                  </Button>
                </Flex>
              </Stack>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* White section with features */}
      <Box
        bg="white"
        mt={-6}
        borderTopRadius="3xl"
        px={8}
        py={16}
        boxShadow="lg"
      >
        <Container maxW="1800px">
          {/* Features Grid */}
          <Grid templateColumns="repeat(3, 1fr)" gap={16} mb={20} mt={32} maxW="1800px" mx="auto">
            <Box>
              <Flex align="center" mb={12}>
                <Box
                  p={8}
                  borderRadius="2xl"
                  bg="#EBF8FF"
                  color="#2B6CB0"
                  mr={6}
                >
                  <Text fontSize="6xl">🔍</Text>
                </Box>
                <Heading size="xl" color="#1A365D" fontWeight="bold">Smart Search</Heading>
              </Flex>
              <Text color="#2D3748" fontSize="2xl" lineHeight="1.8" fontWeight="medium">
                One powerful search engine for all money transfer providers. Compare rates, fees, and delivery times instantly to find your perfect match in seconds.
              </Text>
            </Box>

            <Box>
              <Flex align="center" mb={12}>
                <Box
                  p={8}
                  borderRadius="2xl"
                  bg="#E6FFFA"
                  color="#2C7A7B"
                  mr={6}
                >
                  <Text fontSize="6xl">💰</Text>
                </Box>
                <Heading size="xl" color="#1A365D" fontWeight="bold">Best Rates</Heading>
              </Flex>
              <Text color="#2D3748" fontSize="2xl" lineHeight="1.8" fontWeight="medium">
                Save up to 90% on transfer fees and get the best exchange rates every time. Our comparison tool helps you find the most cost-effective way to send money worldwide.
              </Text>
            </Box>

            <Box>
              <Flex align="center" mb={12}>
                <Box
                  p={8}
                  borderRadius="2xl"
                  bg="#EBF8FF"
                  color="#2B6CB0"
                  mr={6}
                >
                  <Text fontSize="6xl">⚡️</Text>
                </Box>
                <Heading size="xl" color="#1A365D" fontWeight="bold">Fast & Easy</Heading>
              </Flex>
              <Text color="#2D3748" fontSize="2xl" lineHeight="1.8" fontWeight="medium">
                Compare transfer speeds and convenience across multiple providers. Find the perfect balance between fast delivery times and competitive rates for your needs.
              </Text>
            </Box>
          </Grid>

          {/* Trusted By Section with blue scroll */}
          <Box
            py={12}
            overflow="hidden"
            borderTop="1px"
            borderBottom="1px"
            borderColor="gray.200"
            mt={12}
            mb={20}
            css={{
              '&::-webkit-scrollbar': {
                width: '4px',
                height: '4px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
                borderRadius: '24px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#00659D',
                borderRadius: '24px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: '#00b4d8',
              }
            }}
          >
            <Box maxW="1800px" mx="auto">
              <Box textAlign="center" mb={8}>
                <Box
                  as="h2"
                  fontWeight="bold"
                  fontSize="4xl"
                  color="gray.700"
                >
                  Trusted by leading money transfer providers
                </Box>
              </Box>

              <Box
                position="relative"
                overflow="hidden"
                w="full"
                h="100px"
              >
                <Flex
                  w="200%"
                  animation={animation}
                >
                  {[...Array(2)].map((_, i) => (
                    <Flex key={i} justify="space-around" align="center" w="50%">
                      {brandLogos.map((brand, idx) => (
                        <Box
                          key={`${brand.name}-${idx}-${i}`}
                          flex="0 0 auto"
                          mx={8}
                        >
                          <Image
                            src={brand.src}
                            alt={brand.name}
                            h="60px"
                            w="auto"
                            maxW="200px"
                            objectFit="contain"
                            filter="grayscale(90%)"
                            _hover={{ filter: "grayscale(0%)" }}
                            transition="filter 0.2s"
                          />
                        </Box>
                      ))}
                    </Flex>
                  ))}
                </Flex>
              </Box>
            </Box>
          </Box>

          {/* Real-time Delivery Information */}
          <Box mb={20}>
            <Heading
              size="xl"
              color="#1A365D"
              fontWeight="bold"
              textAlign="center"
              mb={4}
            >
              Real-time Delivery Insights
            </Heading>
            
            <Grid templateColumns="repeat(6, 1fr)" gap={4}>
              <Box gridColumn="span 6" mb={8}>
                <Text fontSize="lg" color="gray.600" textAlign="center">
                  Manage transfers? Use our real-time data and tools to determine the best providers, rates, and delivery times with custom filters.
                  Get the latest insights on international money transfers from top providers.
                </Text>
              </Box>

              {/* Popular Routes Table */}
              <Box
                gridColumn="span 6"
                bg="white"
                p={6}
                borderRadius="xl"
                boxShadow="lg"
                border="1px solid"
                borderColor="gray.100"
              >
                <Grid templateColumns="repeat(6, 1fr)" gap={4} mb={4} p={4} bg="gray.50" borderRadius="lg">
                  <Text fontWeight="bold">Route</Text>
                  <Text fontWeight="bold">Sample Size</Text>
                  <Text fontWeight="bold">Fastest</Text>
                  <Text fontWeight="bold">Average</Text>
                  <Text fontWeight="bold">Typical Fee</Text>
                  <Text fontWeight="bold">Best Provider</Text>
                </Grid>

                {[
                  {
                    route: "🇺🇸 USA to 🇮🇳 India",
                    sample: "Very Strong",
                    fastest: "10 min",
                    average: "24 hrs",
                    fee: "$4.99",
                    provider: "Wise"
                  },
                  {
                    route: "🇬🇧 UK to 🇵🇭 Philippines",
                    sample: "Strong",
                    fastest: "15 min",
                    average: "1-2 days",
                    fee: "£3.99",
                    provider: "Remitly"
                  },
                  {
                    route: "🇨🇦 Canada to 🇵🇰 Pakistan",
                    sample: "Very Strong",
                    fastest: "12 min",
                    average: "24 hrs",
                    fee: "C$5.99",
                    provider: "MoneyGram"
                  },
                  {
                    route: "🇦🇺 Australia to 🇻🇳 Vietnam",
                    sample: "Strong",
                    fastest: "20 min",
                    average: "1-2 days",
                    fee: "A$4.50",
                    provider: "Western Union"
                  },
                  {
                    route: "🇪🇺 EU to 🇳🇬 Nigeria",
                    sample: "Very Strong",
                    fastest: "15 min",
                    average: "24 hrs",
                    fee: "€4.99",
                    provider: "WorldRemit"
                  }
                ].map((row, index) => (
                  <Grid
                    key={index}
                    templateColumns="repeat(6, 1fr)"
                    gap={4}
                    p={4}
                    bg="white"
                    _hover={{ bg: "blue.50" }}
                    transition="all 0.2s"
                    borderRadius="lg"
                  >
                    <Text fontWeight="medium">{row.route}</Text>
                    <Text>
                      <Box
                        display="inline-block"
                        w="3"
                        h="3"
                        borderRadius="full"
                        bg={row.sample === "Very Strong" ? "green.400" : "green.200"}
                        mr={2}
                      />
                      {row.sample}
                    </Text>
                    <Text color="green.500" fontWeight="medium">{row.fastest}</Text>
                    <Text>{row.average}</Text>
                    <Text fontWeight="medium">{row.fee}</Text>
                    <Text color="#00b4d8" fontWeight="medium">{row.provider}</Text>
                  </Grid>
                ))}
              </Box>
            </Grid>
          </Box>

          {/* FAQ Section */}
          <Box mb={20}>
            <Heading
              size="2xl"
              mb={8}
              textAlign="center"
              color="black"
              letterSpacing="tight"
              fontWeight="extrabold"
              fontSize="5xl"
              lineHeight="1.2"
            >
              Frequently Asked Questions 💭
            </Heading>
            <Box
              maxW="90%"
              mx="auto"
              bg="white"
              borderRadius="2xl"
              boxShadow="xl"
              p={10}
              border="1px solid"
              borderColor="gray.200"
            >
              <Accordion allowMultiple>
                <AccordionItem border="none" mb={4}>
                  <AccordionButton
                    bg="gray.50"
                    _hover={{ bg: 'gray.100' }}
                    h="80px"
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="gray.200"
                    px={6}
                  >
                    <Box flex="1" textAlign="left" fontSize="xl" fontWeight="medium" color="gray.700">
                      🤔 What is RemitScout?
                    </Box>
                    <AccordionIcon color="gray.500" fontSize="2xl" />
                  </AccordionButton>
                  <AccordionPanel pb={4} pt={6} px={6} fontSize="lg" color="gray.600">
                    RemitScout is a money transfer comparison platform that helps you find the best exchange rates and lowest fees from various international remittance providers. We analyze real-time data from multiple providers to ensure you get the most value for your transfers.
                  </AccordionPanel>
                </AccordionItem>

                <AccordionItem border="none" mb={4}>
                  <AccordionButton
                    bg="gray.50"
                    _hover={{ bg: 'gray.100' }}
                    h="80px"
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="gray.200"
                    px={6}
                  >
                    <Box flex="1" textAlign="left" fontSize="xl" fontWeight="medium" color="gray.700">
                      🚀 How do I use RemitScout?
                    </Box>
                    <AccordionIcon color="gray.500" fontSize="2xl" />
                  </AccordionButton>
                  <AccordionPanel pb={4} pt={6} px={6} fontSize="lg" color="gray.600">
                    Simply select your sending country, receiving country, and the amount you want to send. Our platform will instantly compare various providers, showing you the best exchange rates, fees, and estimated delivery times. You can then choose the provider that best suits your needs and proceed with your transfer.
                  </AccordionPanel>
                </AccordionItem>

                <AccordionItem border="none" mb={4}>
                  <AccordionButton
                    bg="gray.50"
                    _hover={{ bg: 'gray.100' }}
                    h="80px"
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="gray.200"
                    px={6}
                  >
                    <Box flex="1" textAlign="left" fontSize="xl" fontWeight="medium" color="gray.700">
                      🔒 Are the providers trustworthy?
                    </Box>
                    <AccordionIcon color="gray.500" fontSize="2xl" />
                  </AccordionButton>
                  <AccordionPanel pb={4} pt={6} px={6} fontSize="lg" color="gray.600">
                    Yes, we only partner with licensed and regulated money transfer providers. Each provider undergoes strict verification to ensure they meet international security standards and regulatory requirements. We regularly monitor their performance and user feedback to maintain high service quality.
                  </AccordionPanel>
                </AccordionItem>

                <AccordionItem border="none" mb={4}>
                  <AccordionButton
                    bg="gray.50"
                    _hover={{ bg: 'gray.100' }}
                    h="80px"
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="gray.200"
                    px={6}
                  >
                    <Box flex="1" textAlign="left" fontSize="xl" fontWeight="medium" color="gray.700">
                      📈 How current are the exchange rates?
                    </Box>
                    <AccordionIcon color="gray.500" fontSize="2xl" />
                  </AccordionButton>
                  <AccordionPanel pb={4} pt={6} px={6} fontSize="lg" color="gray.600">
                    Our exchange rates are updated in real-time from reliable market sources. However, due to the dynamic nature of currency markets, the final rate may vary slightly at the time of your actual transfer. We recommend checking the final rate on the provider's platform before completing your transaction.
                  </AccordionPanel>
                </AccordionItem>

                <AccordionItem border="none">
                  <AccordionButton
                    bg="gray.50"
                    _hover={{ bg: 'gray.100' }}
                    h="80px"
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="gray.200"
                    px={6}
                  >
                    <Box flex="1" textAlign="left" fontSize="xl" fontWeight="medium" color="gray.700">
                      🛡️ Is my information secure?
                    </Box>
                    <AccordionIcon color="gray.500" fontSize="2xl" />
                  </AccordionButton>
                  <AccordionPanel pb={4} pt={6} px={6} fontSize="lg" color="gray.600">
                    Absolutely. We employ bank-level encryption and security measures to protect your personal information. We never store sensitive financial data, and all transactions are processed through secure, encrypted connections with our partner providers.
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </Box>
          </Box>

          {/* Newsletter Signup */}
          <Box 
            maxW="90%"
            mx="auto"
            bg="gray.50"
            borderRadius="2xl"
            boxShadow="xl"
            p={16}
            border="1px solid"
            borderColor="gray.200"
            mb={20}
          >
            <Container maxW="container.xl">
              <Heading size="xl" mb={4} textAlign="center" color="#00b4d8" fontWeight="bold">
                ✉️ Sign Up for Our Newsletter
              </Heading>
              <Text mb={8} color="gray.600" textAlign="center" fontSize="2xl">
                Get updates on the latest exchange rates, tips, and special deals! 🌟
              </Text>
              <Flex
                as="form"
                onSubmit={handleSubscribe}
                direction={{ base: "column", md: "row" }}
                justify="center"
                align="center"
                gap={6}
                maxW="800px"
                mx="auto"
              >
                <Input
                  variant="outline"
                  placeholder="Enter your email"
                  bg="white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  size="lg"
                  h="80px"
                  fontSize="xl"
                  w={{ base: "100%", md: "500px" }}
                  borderRadius="xl"
                  borderWidth="2px"
                  _hover={{ borderColor: "#00b4d8" }}
                  _focus={{ borderColor: "#00b4d8", boxShadow: "0 0 0 1px #00b4d8" }}
                />
                <Button
                  type="submit"
                  size="lg"
                  bg={buttonGradient}
                  color="white"
                  h="80px"
                  px={12}
                  fontSize="xl"
                  borderRadius="xl"
                  fontWeight="bold"
                  _hover={{
                    bg: "#0077b6",
                    transform: "translateY(-1px)",
                  }}
                  _active={{
                    bg: "#0077b6",
                  }}
                >
                  Subscribe
                </Button>
              </Flex>
            </Container>
          </Box>
        </Container>
      </Box>

      {/* Get Started CTA */}
      <Box
        py={40}
        bg="#00659D"  // Changed to a deeper blue
        textAlign="center"
        w="full"
        mt={20}  // Added top margin for more spacing
      >
        <Container maxW="container.xl">
          <VStack spacing={8}>
            <Heading size="2xl" color="white" fontWeight="extrabold"> 
              Ready to Save on Your Next Transfer? 💸
            </Heading>
            <Text fontSize="2xl" color="white" maxW="800px" opacity={0.9}>
              Compare rates and send money with confidence in just a few clicks ✨
            </Text>
            <Button
              size="lg"
              bg="white"  // Changed to white
              color="#0077b6"  // Changed to blue
              px={12}
              py={8}
              fontSize="2xl"
              borderRadius="xl"
              fontWeight="bold"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              _hover={{
                bg: "#f0f0f0",
                transform: "translateY(-1px)",
              }}
              _active={{
                bg: "#e0e0e0",
              }}
            >
              Get Started 🚀
            </Button>
          </VStack>
        </Container>
      </Box>

      {/* Extra spacing at bottom */}
      <Box h={20} bg="white" />

      <style jsx>{`
        @keyframes scrollLeft {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(72, 187, 120, 0.4);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(72, 187, 120, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(72, 187, 120, 0);
          }
        }
      `}</style>
    </Box>
  );
}

export default Home;
