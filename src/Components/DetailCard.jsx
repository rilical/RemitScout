import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProvidersContext } from "../Context/ProvidersContext";
import {
  Container,
  Heading,
  Text,
  Spinner,
  Flex,
  Box,
  Button,
  Image,
  VStack,
  HStack,
  Badge,
  useToast,
} from "@chakra-ui/react";

function ProviderDetail() {
  const { id } = useParams();
  const { state, dispatch } = useContext(ProvidersContext);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    setTimeout(() => {
      const found = state.providers.find((p) => p.id === id);
      setProvider(found);
      setLoading(false);
    }, 500);
  }, [id, state.providers]);

  const handleFavorite = () => {
    if (provider) {
      if (state.favorites.some(p => p.id === provider.id)) {
        dispatch({ type: "REMOVE_FROM_FAVORITES", payload: provider });
        toast({
          title: "Removed from favorites",
          status: "info",
          duration: 2000,
          isClosable: true,
        });
      } else {
        dispatch({ type: "ADD_TO_FAVORITES", payload: provider });
        toast({
          title: "Added to favorites",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      }
    }
  };

  const handleProceed = () => {
    navigate(`/payment/${provider.id}`);
  };

  if (loading) {
    return (
      <Flex justify="center" mt={5}>
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (!provider) {
    return (
      <Container maxW="container.lg">
        <Heading>Provider not found</Heading>
      </Container>
    );
  }

  const isFavorite = state.favorites.some(p => p.id === provider.id);

  return (
    <Container maxW="container.lg" mt={5}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="xl" mb={2}>{provider.providerName}</Heading>
          <HStack spacing={2}>
            <Badge colorScheme="blue">{provider.rating} / 5</Badge>
            <Badge colorScheme="green">{provider.reviewsCount} reviews</Badge>
          </HStack>
        </Box>

        {provider.images && provider.images.length > 0 && (
          <Box>
            <Image
              src={provider.images[0]}
              alt={provider.providerName}
              borderRadius="lg"
              objectFit="cover"
              w="100%"
              h="300px"
            />
          </Box>
        )}

        <Box p={6} borderWidth="1px" borderRadius="lg" bg="white">
          <VStack align="stretch" spacing={4}>
            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={2}>Transfer Details</Text>
              <HStack justify="space-between">
                <Text>Sending From:</Text>
                <Text>{provider.sendingFrom}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text>Sending To:</Text>
                <Text>{provider.sendingTo}</Text>
              </HStack>
            </Box>

            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={2}>Costs</Text>
              <HStack justify="space-between">
                <Text>Transfer Fee:</Text>
                <Text>${provider.fee.toFixed(2)}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text>Exchange Rate:</Text>
                <Text>{provider.exchangeRate.toFixed(2)}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text>Total Cost:</Text>
                <Text fontWeight="bold" color="blue.600">
                  ${provider.totalCost.toFixed(2)}
                </Text>
              </HStack>
            </Box>

            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={2}>Delivery</Text>
              <Text>Estimated Time: {provider.estimatedTime}</Text>
            </Box>

            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={2}>Description</Text>
              <Text>{provider.shortDescription}</Text>
            </Box>

            <HStack spacing={4}>
              <Button
                colorScheme="blue"
                size="lg"
                flex={1}
                onClick={handleProceed}
              >
                Proceed to Payment
              </Button>
              <Button
                colorScheme={isFavorite ? "pink" : "gray"}
                size="lg"
                onClick={handleFavorite}
              >
                {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              </Button>
            </HStack>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}

export default ProviderDetail;
