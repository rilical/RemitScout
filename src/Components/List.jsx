import React, { useContext, useState, useEffect } from "react";
import {
  Container,
  Heading,
  Select,
  Spinner,
  Flex,
  Text,
  Box,
  VStack,
  HStack,
  Badge,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { ProvidersContext } from "../Context/ProvidersContext";

function ProviderList() {
  const { state } = useContext(ProvidersContext);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [sortValue, setSortValue] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate load time
    setTimeout(() => {
      setLoading(false);
    }, 500);

    const searchData = JSON.parse(localStorage.getItem("remitSearch")) || {};
    let results = state.providers;

    // Filter by from/to if provided
    if (searchData.fromCountry && searchData.toCountry) {
      results = results.filter(
        (prov) =>
          prov.sendingFrom === searchData.fromCountry &&
          prov.sendingTo === searchData.toCountry
      );
    }
    setFilteredProviders(results);
  }, [state.providers]);

  const handleSort = (e) => {
    const value = e.target.value;
    setSortValue(value);
    let sorted = [...filteredProviders];

    if (value === "fee-asc") {
      sorted.sort((a, b) => a.fee - b.fee);
    } else if (value === "rate-desc") {
      sorted.sort((a, b) => b.exchangeRate - a.exchangeRate);
    } else if (value === "time-asc") {
      sorted.sort((a, b) =>
        a.estimatedTime.localeCompare(b.estimatedTime)
      );
    }
    setFilteredProviders(sorted);
  };

  if (loading) {
    return (
      <Flex justify="center" mt={5}>
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Container maxW="container.lg" mt={5}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading as="h2" size="lg" mb={4}>
            Available Providers
          </Heading>
          <Select
            placeholder="Sort by"
            w="200px"
            mb={4}
            value={sortValue}
            onChange={handleSort}
          >
            <option value="fee-asc">Lowest Fee</option>
            <option value="rate-desc">Highest Exchange Rate</option>
            <option value="time-asc">Fastest Transfer</option>
          </Select>
        </Box>

        {filteredProviders.length === 0 ? (
          <Text>No providers found for your search.</Text>
        ) : (
          <VStack spacing={4} align="stretch">
            {filteredProviders.map((provider) => (
              <Link key={provider.id} to={`/provider/${provider.id}`}>
                <Box
                  p={5}
                  borderWidth="1px"
                  borderRadius="lg"
                  _hover={{
                    boxShadow: "lg",
                    transform: "translateY(-2px)",
                    transition: "all 0.2s",
                  }}
                >
                  <HStack justify="space-between">
                    <VStack align="start" spacing={2}>
                      <Heading size="md">{provider.providerName}</Heading>
                      <Text>Fee: ${provider.fee.toFixed(2)}</Text>
                      <Text>Exchange Rate: {provider.exchangeRate.toFixed(2)}</Text>
                      <Text>Estimated Time: {provider.estimatedTime}</Text>
                      <HStack>
                        <Badge colorScheme="blue">
                          {provider.rating} / 5
                        </Badge>
                        <Badge colorScheme="green">
                          {provider.reviewsCount} reviews
                        </Badge>
                      </HStack>
                    </VStack>
                    <Box>
                      <Text
                        fontSize="xl"
                        fontWeight="bold"
                        color="blue.600"
                      >
                        ${provider.totalCost.toFixed(2)}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        Total Cost
                      </Text>
                    </Box>
                  </HStack>
                </Box>
              </Link>
            ))}
          </VStack>
        )}
      </VStack>
    </Container>
  );
}

export default ProviderList;
