import React, { useState } from "react";
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
  Grid,
  GridItem,
  Checkbox,
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import {
  MdEmail,
  MdLock,
  MdVisibility,
  MdVisibilityOff,
  MdPerson,
  MdPhone,
  MdLocationOn,
} from "react-icons/md";

const SignUp = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast({
        title: "Please fill all required fields",
        status: "error",
        duration: 2000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords do not match",
        status: "error",
        duration: 2000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    if (!acceptTerms) {
      toast({
        title: "Please accept the terms and conditions",
        status: "error",
        duration: 2000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    try {
      // Simulate user registration
      toast({
        title: "Account created successfully",
        description: "You can now sign in with your credentials",
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "top",
      });
      navigate("/signin");
    } catch (error) {
      toast({
        title: "Error creating account",
        description: error.message,
        status: "error",
        duration: 2000,
        isClosable: true,
        position: "top",
      });
    }
  };

  return (
    <Box bgColor="#f7f9fb" minH="100vh" py={8}>
      <Container maxW="container.md">
        <Box bg="white" p={8} borderRadius="lg" boxShadow="base">
          <Stack spacing={6}>
            <Box textAlign="center">
              <Heading size="xl" mb={2}>
                Create Your Account
              </Heading>
              <Text color="gray.600">
                Join RemitScout for secure and affordable money transfers
              </Text>
            </Box>

            <form onSubmit={handleSubmit}>
              <Stack spacing={6}>
                {/* Personal Information */}
                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
                  <FormControl isRequired>
                    <FormLabel>First Name</FormLabel>
                    <InputGroup>
                      <Input
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="Enter your first name"
                      />
                      <InputRightElement>
                        <Icon as={MdPerson} color="gray.500" />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Last Name</FormLabel>
                    <InputGroup>
                      <Input
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Enter your last name"
                      />
                      <InputRightElement>
                        <Icon as={MdPerson} color="gray.500" />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>
                </Grid>

                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <InputGroup>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                    />
                    <InputRightElement>
                      <Icon as={MdEmail} color="gray.500" />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
                  <FormControl>
                    <FormLabel>Phone Number</FormLabel>
                    <InputGroup>
                      <Input
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Enter your phone number"
                      />
                      <InputRightElement>
                        <Icon as={MdPhone} color="gray.500" />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Address</FormLabel>
                    <InputGroup>
                      <Input
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Enter your address"
                      />
                      <InputRightElement>
                        <Icon as={MdLocationOn} color="gray.500" />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>
                </Grid>

                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
                  <FormControl isRequired>
                    <FormLabel>Password</FormLabel>
                    <InputGroup>
                      <Input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Create a password"
                      />
                      <InputRightElement>
                        <Icon
                          as={showPassword ? MdVisibilityOff : MdVisibility}
                          color="gray.500"
                          cursor="pointer"
                          onClick={() => setShowPassword(!showPassword)}
                        />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Confirm Password</FormLabel>
                    <InputGroup>
                      <Input
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm your password"
                      />
                      <InputRightElement>
                        <Icon
                          as={showConfirmPassword ? MdVisibilityOff : MdVisibility}
                          color="gray.500"
                          cursor="pointer"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>
                </Grid>

                <Checkbox
                  isChecked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                >
                  I accept the{" "}
                  <ChakraLink as={Link} to="/terms" color="blue.500">
                    terms and conditions
                  </ChakraLink>
                </Checkbox>

                <Button type="submit" colorScheme="blue" size="lg">
                  Create Account
                </Button>

                <Box textAlign="center">
                  <Text>
                    Already have an account?{" "}
                    <ChakraLink as={Link} to="/signin" color="blue.500">
                      Sign in
                    </ChakraLink>
                  </Text>
                </Box>
              </Stack>
            </form>

            {/* Trust Indicators */}
            <Box borderTopWidth={1} pt={6}>
              <Text textAlign="center" color="gray.600" fontSize="sm">
                Your data is protected with bank-level security
              </Text>
              <Stack
                direction="row"
                spacing={4}
                justify="center"
                mt={4}
                color="gray.500"
              >
                <Icon as={MdLock} w={6} h={6} />
                <Text fontSize="sm">
                  256-bit encryption for maximum security
                </Text>
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default SignUp;
