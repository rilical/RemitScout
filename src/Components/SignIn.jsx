import React, { useState, useContext } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Link as ChakraLink,
  useToast,
  InputGroup,
  InputRightElement,
  Icon,
  Image,
  SimpleGrid,
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdSecurity, MdSpeed } from "react-icons/md";
import { FaUserShield } from "react-icons/fa";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { SignIn } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: !email ? "Please enter your email address" : "Please enter your password",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    if (!email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    try {
      await SignIn(email, password);
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in to RemitScout",
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "top",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Unable to sign in",
        description: error.message === "Firebase: Error (auth/invalid-credential)." 
          ? "Invalid email or password. Please try again."
          : error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
    }
  };

  return (
    <Box bgColor="#f7f9fb" minH="100vh" py={8}>
      <Container maxW="container.sm">
        <Box bg="white" p={8} borderRadius="lg" boxShadow="lg">
          <Stack spacing={6}>
            <Box textAlign="center">
              <Image
                src="/remitscout-logo.png"
                alt="RemitScout Logo"
                height="60px"
                mx="auto"
                mb={4}
              />
              <Heading size="xl" mb={2} color="blue.600">
                Welcome Back
              </Heading>
              <Text color="gray.600">
                Sign in to access your RemitScout account
              </Text>
            </Box>

            <form onSubmit={handleSubmit}>
              <Stack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <InputGroup>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      borderColor="gray.300"
                      _hover={{ borderColor: "blue.400" }}
                      _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                    />
                    <InputRightElement>
                      <Icon as={MdEmail} color="blue.500" />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      borderColor="gray.300"
                      _hover={{ borderColor: "blue.400" }}
                      _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                    />
                    <InputRightElement>
                      <Icon
                        as={showPassword ? MdVisibilityOff : MdVisibility}
                        color="blue.500"
                        cursor="pointer"
                        onClick={() => setShowPassword(!showPassword)}
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <Stack spacing={6}>
                  <Button 
                    type="submit" 
                    colorScheme="blue" 
                    size="lg"
                    _hover={{ bg: "blue.600" }}
                    _active={{ bg: "blue.700" }}
                  >
                    Sign In
                  </Button>

                  <Box textAlign="center">
                    <ChakraLink as={Link} to="/forgot-password" color="blue.500" _hover={{ color: "blue.600" }}>
                      Forgot your password?
                    </ChakraLink>
                  </Box>

                  <Box textAlign="center">
                    <Text>
                      Don't have an account?{" "}
                      <ChakraLink as={Link} to="/signup" color="blue.500" _hover={{ color: "blue.600" }}>
                        Sign up
                      </ChakraLink>
                    </Text>
                  </Box>
                </Stack>
              </Stack>
            </form>

            {/* Enhanced Trust Indicators */}
            <Box borderTopWidth={1} pt={6}>
              <Text textAlign="center" color="gray.600" fontSize="sm" fontWeight="medium" mb={4}>
                Trusted by millions of users worldwide
              </Text>
              <SimpleGrid columns={3} spacing={4} px={4}>
                <Stack align="center" spacing={2}>
                  <Icon as={MdLock} w={6} h={6} color="blue.500" />
                  <Text fontSize="sm" textAlign="center" color="gray.600">
                    Bank-level Security
                  </Text>
                </Stack>
                <Stack align="center" spacing={2}>
                  <Icon as={MdSpeed} w={6} h={6} color="blue.500" />
                  <Text fontSize="sm" textAlign="center" color="gray.600">
                    Fast Transfers
                  </Text>
                </Stack>
                <Stack align="center" spacing={2}>
                  <Icon as={FaUserShield} w={6} h={6} color="blue.500" />
                  <Text fontSize="sm" textAlign="center" color="gray.600">
                    24/7 Support
                  </Text>
                </Stack>
              </SimpleGrid>
            </Box>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default SignIn;
