import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  Image,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Box bg="gray.50" minH="100vh" py={20}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="center">
          <Heading size="4xl" color="#00659D">
            404
          </Heading>
          <Heading size="xl" textAlign="center">
            Page Not Found
          </Heading>
          <Text fontSize="xl" color="gray.600" textAlign="center" maxW="lg">
            The page you're looking for doesn't seem to exist.
          </Text>
          <Button
            size="lg"
            bg="#00b4d8"
            color="white"
            onClick={() => navigate('/')}
            _hover={{
              bg: "#0077b6",
              transform: "translateY(-2px)",
              boxShadow: "lg",
            }}
            _active={{
              bg: "#0077b6",
              transform: "translateY(0)",
            }}
          >
            Go to Home
          </Button>
        </VStack>
      </Container>
    </Box>
  );
};

export default NotFound; 