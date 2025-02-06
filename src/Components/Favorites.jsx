import React, { useContext } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Grid,
  GridItem,
  Button,
  Image,
  Stack,
  Flex,
  Icon,
  useToast,
} from "@chakra-ui/react";
import { ProvidersContext } from "../Context/ProvidersContext";
import { AuthContext } from "../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FaRegHeart, FaHeart } from "react-icons/fa";
import { MdPayment, MdSpeed, MdSecurity } from "react-icons/md";

const Favorites = () => {
  const { state, dispatch } = useContext(ProvidersContext);
  const { isAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();

  if (!isAuth) {
    return (
      <Box bgColor="#f7f9fb" minH="100vh" py={8}>
        <Container maxW="container.xl">
          <Box bg="white" p={8} borderRadius="lg" boxShadow="base" textAlign="center">
            <Heading size="lg" mb={4}>
              Sign in to view your favorites
            </Heading>
            <Text color="gray.600" mb={6}>
              Save your preferred money transfer providers for quick access
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

  const favoriteProviders = state.providers.filter(provider => provider.isFav);

  return (
    <Box bgColor="#f7f9fb" minH="100vh" py={8}>
      <Container maxW="container.xl">
        <Box bg="white" p={6} borderRadius="lg" boxShadow="base" mb={6}>
          <Heading size="lg">Saved Providers</Heading>
          <Text color="gray.600" mt={2}>
            Your favorite money transfer providers
          </Text>
        </Box>

        {favoriteProviders.length === 0 ? (
          <Box bg="white" p={8} borderRadius="lg" boxShadow="base" textAlign="center">
            <Text fontSize="xl" color="gray.600" mb={4}>
              You haven't saved any providers yet
            </Text>
            <Button
              colorScheme="blue"
              onClick={() => navigate("/providers")}
            >
              Browse Providers
            </Button>
          </Box>
        ) : (
          <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={6}>
            {favoriteProviders.map((provider) => (
              <GridItem key={provider.id}>
                <Box
                  bg="white"
                  p={6}
                  borderRadius="lg"
                  boxShadow="base"
                  _hover={{ boxShadow: "md" }}
                  transition="all 0.2s"
                >
                  <Flex gap={6}>
                    {/* Provider Logo */}
                    <Box w="150px">
                      <Image
                        src={provider.images[0]}
                        alt={provider.providerName}
                        objectFit="contain"
                        h="60px"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dispatch({ type: "TOGGLE_FAVORITE", payload: provider.id })}
                        mt={2}
                        leftIcon={<FaHeart color="red" />}
                      >
                        Saved
                      </Button>
                    </Box>

                    {/* Provider Details */}
                    <Stack flex="1" spacing={3}>
                      <Heading size="md">{provider.providerName}</Heading>
                      <Text color="gray.600" fontSize="sm">
                        {provider.shortDescription}
                      </Text>

                      <Flex justify="space-between" align="center">
                        <Stack spacing={1}>
                          <Text color="gray.500" fontSize="sm">
                            Transfer Fee
                          </Text>
                          <Text fontWeight="bold" color="green.600">
                            ${provider.fee.toFixed(2)}
                          </Text>
                        </Stack>

                        <Stack spacing={1}>
                          <Text color="gray.500" fontSize="sm">
                            Exchange Rate
                          </Text>
                          <Text fontWeight="bold">
                            1 USD = {provider.exchangeRate.toFixed(2)}
                          </Text>
                        </Stack>

                        <Stack spacing={1}>
                          <Text color="gray.500" fontSize="sm">
                            Delivery
                          </Text>
                          <Text fontWeight="bold">
                            {provider.estimatedTime}
                          </Text>
                        </Stack>
                      </Flex>

                      <Flex justify="space-between" align="center" mt={2}>
                        <Flex gap={4} color="gray.600" fontSize="sm">
                          {provider.exploreFeatures.slice(0, 2).map((feature, index) => (
                            <Flex key={index} align="center" gap={1}>
                              <Icon
                                as={
                                  feature.logo === "MdPayment"
                                    ? MdPayment
                                    : feature.logo === "MdSpeed"
                                    ? MdSpeed
                                    : MdSecurity
                                }
                              />
                              <Text>{feature.detail}</Text>
                            </Flex>
                          ))}
                        </Flex>

                        <Button
                          colorScheme="blue"
                          size="sm"
                          onClick={() => navigate(`/provider/${provider.id}`)}
                        >
                          Send Money
                        </Button>
                      </Flex>
                    </Stack>
                  </Flex>
                </Box>
              </GridItem>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default Favorites; 