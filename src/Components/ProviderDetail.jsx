import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Button,
  Image,
  Grid,
  GridItem,
  Stack,
  Badge,
  Icon,
  Divider,
  useToast,
  HStack,
  VStack,
} from "@chakra-ui/react";
import { useParams, useNavigate } from "react-router-dom";
import { ProvidersContext } from "../Context/ProvidersContext";
import { AuthContext } from "../Context/AuthContext";
import { FaRegHeart, FaHeart } from "react-icons/fa";
import { MdPayment, MdSpeed, MdSecurity } from "react-icons/md";

const ProviderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { state, dispatch } = useContext(ProvidersContext);
  const { isAuth } = useContext(AuthContext);
  const [provider, setProvider] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");

  useEffect(() => {
    const found = state.providers.find((p) => p.id === id);
    if (found) {
      setProvider(found);
      setSelectedImage(found.images[0]);
    }
  }, [id, state.providers]);

  if (!provider) {
    return (
      <Box textAlign="center" py={10}>
        <Text>Provider not found</Text>
      </Box>
    );
  }

  const handleFavorite = () => {
    if (!isAuth) {
      toast({
        title: "Please sign in first",
        status: "info",
        duration: 2000,
        isClosable: true,
        position: "top",
      });
      return;
    }
    dispatch({ type: "TOGGLE_FAVORITE", payload: id });
  };

  const handleSendMoney = () => {
    if (!isAuth) {
      toast({
        title: "Please sign in to proceed",
        status: "info",
        duration: 2000,
        isClosable: true,
        position: "top",
      });
      return;
    }
    navigate(`/payment/${id}`);
  };

  return (
    <Box bgColor="#f7f9fb" minH="100vh" py={8}>
      <Container maxW="container.xl">
        {/* Provider Header */}
        <Box bg="white" p={6} borderRadius="lg" boxShadow="base" mb={6}>
          <Flex
            direction={{ base: "column", md: "row" }}
            align="center"
            justify="space-between"
            gap={6}
          >
            <Flex align="center" gap={6}>
              <Image
                src={provider.images[0]}
                alt={provider.providerName}
                h="60px"
                objectFit="contain"
              />
              <Box>
                <Heading size="lg">{provider.providerName}</Heading>
                <Text color="gray.600" mt={1}>
                  {provider.shortDescription}
                </Text>
              </Box>
            </Flex>
            <HStack>
              <Button
                variant="outline"
                leftIcon={provider.isFav ? <FaHeart color="red" /> : <FaRegHeart />}
                onClick={handleFavorite}
              >
                {provider.isFav ? "Saved" : "Save"}
              </Button>
              <Button colorScheme="blue" onClick={handleSendMoney}>
                Send Money
              </Button>
            </HStack>
          </Flex>
        </Box>

        <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
          {/* Main Content */}
          <GridItem>
            {/* Transfer Details */}
            <Box bg="white" p={6} borderRadius="lg" boxShadow="base" mb={6}>
              <Heading size="md" mb={4}>
                Transfer Details
              </Heading>
              <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                <VStack align="start">
                  <Text color="gray.500">Transfer Fee</Text>
                  <Text fontSize="xl" fontWeight="bold" color="green.600">
                    ${provider.fee.toFixed(2)}
                  </Text>
                </VStack>
                <VStack align="start">
                  <Text color="gray.500">Exchange Rate</Text>
                  <Text fontSize="xl" fontWeight="bold">
                    1 USD = {provider.exchangeRate.toFixed(2)}
                  </Text>
                </VStack>
                <VStack align="start">
                  <Text color="gray.500">Total Cost</Text>
                  <Text fontSize="xl" fontWeight="bold" color="blue.600">
                    ${provider.totalCost.toFixed(2)}
                  </Text>
                </VStack>
                <VStack align="start">
                  <Text color="gray.500">Delivery Time</Text>
                  <Text fontSize="xl" fontWeight="bold">
                    {provider.estimatedTime}
                  </Text>
                </VStack>
              </Grid>
            </Box>

            {/* Features */}
            <Box bg="white" p={6} borderRadius="lg" boxShadow="base" mb={6}>
              <Heading size="md" mb={4}>
                Features
              </Heading>
              <Grid templateColumns="repeat(3, 1fr)" gap={6}>
                {provider.exploreFeatures.map((feature, index) => (
                  <Box key={index} p={4} borderRadius="md" borderWidth="1px">
                    <Icon
                      as={
                        feature.logo === "MdPayment"
                          ? MdPayment
                          : feature.logo === "MdSpeed"
                          ? MdSpeed
                          : MdSecurity
                      }
                      w={6}
                      h={6}
                      color="blue.500"
                      mb={2}
                    />
                    <Text fontWeight="bold">{feature.featureName}</Text>
                    <Text color="gray.600" fontSize="sm">
                      {feature.detail}
                    </Text>
                  </Box>
                ))}
              </Grid>
            </Box>

            {/* Description */}
            <Box bg="white" p={6} borderRadius="lg" boxShadow="base">
              <Heading size="md" mb={4}>
                About {provider.providerName}
              </Heading>
              <Text color="gray.600">{provider.description}</Text>
            </Box>
          </GridItem>

          {/* Sidebar */}
          <GridItem>
            {/* Rating & Reviews */}
            <Box bg="white" p={6} borderRadius="lg" boxShadow="base" mb={6}>
              <Heading size="md" mb={4}>
                Rating & Reviews
              </Heading>
              <VStack align="start" spacing={4}>
                <Badge
                  colorScheme={
                    provider.rating >= 4.5
                      ? "green"
                      : provider.rating >= 4
                      ? "blue"
                      : "orange"
                  }
                  fontSize="xl"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  {provider.rating} ★ {provider.review}
                </Badge>
                <Text color="gray.600">
                  Based on {provider.reviewCount} reviews
                </Text>
              </VStack>
            </Box>

            {/* Payment Methods */}
            <Box bg="white" p={6} borderRadius="lg" boxShadow="base" mb={6}>
              <Heading size="md" mb={4}>
                Payment Methods
              </Heading>
              <Text color="gray.600">{provider.paymentMode}</Text>
            </Box>

            {/* Refund Policy */}
            <Box bg="white" p={6} borderRadius="lg" boxShadow="base">
              <Heading size="md" mb={4}>
                Refund Policy
              </Heading>
              <Text color="gray.600">{provider.refund}</Text>
            </Box>
          </GridItem>
        </Grid>
      </Container>
    </Box>
  );
};

export default ProviderDetail; 