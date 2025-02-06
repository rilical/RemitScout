import React, { useContext, useState } from "react";
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
  Grid,
  GridItem,
  useToast,
  Avatar,
  VStack,
  HStack,
  Divider,
  Icon,
} from "@chakra-ui/react";
import { AuthContext } from "../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import { MdEdit, MdPerson, MdEmail, MdPhone, MdLocationOn } from "react-icons/md";

const Profile = () => {
  const { isAuth, currentUser, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: currentUser?.firstName || "",
    lastName: currentUser?.lastName || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    address: currentUser?.address || "",
  });

  if (!isAuth) {
    return (
      <Box bgColor="#f7f9fb" minH="100vh" py={8}>
        <Container maxW="container.xl">
          <Box bg="white" p={8} borderRadius="lg" boxShadow="base" textAlign="center">
            <Heading size="lg" mb={4}>
              Sign in to view your profile
            </Heading>
            <Text color="gray.600" mb={6}>
              Manage your personal information and preferences
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: "Please fill all required fields",
        status: "error",
        duration: 2000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    // Update user profile
    updateUser(formData);
    setIsEditing(false);
    
    toast({
      title: "Profile updated successfully",
      status: "success",
      duration: 2000,
      isClosable: true,
      position: "top",
    });
  };

  return (
    <Box bgColor="#f7f9fb" minH="100vh" py={8}>
      <Container maxW="container.xl">
        <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} gap={6}>
          {/* Profile Summary */}
          <GridItem>
            <Box bg="white" p={6} borderRadius="lg" boxShadow="base">
              <VStack spacing={6} align="center">
                <Avatar
                  size="2xl"
                  name={`${formData.firstName} ${formData.lastName}`}
                  src={currentUser?.avatar}
                />
                <Heading size="lg">
                  {formData.firstName} {formData.lastName}
                </Heading>
                <Text color="gray.600">{formData.email}</Text>
                <Button
                  leftIcon={<MdEdit />}
                  onClick={() => setIsEditing(!isEditing)}
                  colorScheme="blue"
                  variant="outline"
                  w="full"
                >
                  {isEditing ? "Cancel Editing" : "Edit Profile"}
                </Button>
              </VStack>
            </Box>
          </GridItem>

          {/* Profile Details */}
          <GridItem>
            <Box bg="white" p={6} borderRadius="lg" boxShadow="base">
              <form onSubmit={handleSubmit}>
                <Stack spacing={6}>
                  <Heading size="md">Personal Information</Heading>

                  <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
                    <FormControl isRequired>
                      <FormLabel>First Name</FormLabel>
                      <Input
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        isReadOnly={!isEditing}
                        leftIcon={<Icon as={MdPerson} color="gray.500" />}
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Last Name</FormLabel>
                      <Input
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        isReadOnly={!isEditing}
                      />
                    </FormControl>
                  </Grid>

                  <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      isReadOnly={!isEditing}
                      leftIcon={<Icon as={MdEmail} color="gray.500" />}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Phone Number</FormLabel>
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      isReadOnly={!isEditing}
                      leftIcon={<Icon as={MdPhone} color="gray.500" />}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Address</FormLabel>
                    <Input
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      isReadOnly={!isEditing}
                      leftIcon={<Icon as={MdLocationOn} color="gray.500" />}
                    />
                  </FormControl>

                  {isEditing && (
                    <Button type="submit" colorScheme="blue" size="lg">
                      Save Changes
                    </Button>
                  )}
                </Stack>
              </form>
            </Box>

            {/* Activity Summary */}
            <Box bg="white" p={6} borderRadius="lg" boxShadow="base" mt={6}>
              <Heading size="md" mb={4}>
                Account Activity
              </Heading>
              <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
                <VStack align="start" p={4} borderWidth="1px" borderRadius="md">
                  <Text color="gray.600">Total Transfers</Text>
                  <Heading size="lg">12</Heading>
                </VStack>
                <VStack align="start" p={4} borderWidth="1px" borderRadius="md">
                  <Text color="gray.600">Amount Sent</Text>
                  <Heading size="lg">$2,450</Heading>
                </VStack>
                <VStack align="start" p={4} borderWidth="1px" borderRadius="md">
                  <Text color="gray.600">Saved Providers</Text>
                  <Heading size="lg">3</Heading>
                </VStack>
              </Grid>
            </Box>
          </GridItem>
        </Grid>
      </Container>
    </Box>
  );
};

export default Profile; 