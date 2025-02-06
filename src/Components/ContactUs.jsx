import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  useToast,
  Select,
  useColorModeValue,
} from '@chakra-ui/react';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: 'Please fill all required fields',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: 'Invalid email address',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: 'Message Sent!',
        description: "We'll get back to you as soon as possible.",
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });

      // Clear form
      setFormData({
        name: '',
        email: '',
        subject: '',
        category: '',
        message: '',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box bg={bgColor} minH="100vh">
      {/* Hero Section */}
      <Box bg="#00659D" py={20} color="white">
        <Container maxW="container.xl" textAlign="center">
          <Heading size="2xl" mb={4}>Contact Us 📬</Heading>
          <Text fontSize="xl" maxW="2xl" mx="auto" opacity={0.9}>
            Have questions about our services? We're here to help and answer any question you might have.
          </Text>
        </Container>
      </Box>

      <Container maxW="container.md" py={16}>
        {/* Contact Form */}
        <Box
          bg={cardBg}
          p={8}
          borderRadius="xl"
          boxShadow="xl"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <VStack as="form" spacing={6} onSubmit={handleSubmit}>
            <Heading size="lg" w="full">Send us a Message</Heading>

            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
                size="lg"
                borderRadius="lg"
                _hover={{ borderColor: "#00b4d8" }}
                _focus={{ borderColor: "#00b4d8", boxShadow: "0 0 0 1px #00b4d8" }}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                size="lg"
                borderRadius="lg"
                _hover={{ borderColor: "#00b4d8" }}
                _focus={{ borderColor: "#00b4d8", boxShadow: "0 0 0 1px #00b4d8" }}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Subject</FormLabel>
              <Input
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="What's this about?"
                size="lg"
                borderRadius="lg"
                _hover={{ borderColor: "#00b4d8" }}
                _focus={{ borderColor: "#00b4d8", boxShadow: "0 0 0 1px #00b4d8" }}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Category</FormLabel>
              <Select
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="Select a category"
                size="lg"
                borderRadius="lg"
                _hover={{ borderColor: "#00b4d8" }}
                _focus={{ borderColor: "#00b4d8", boxShadow: "0 0 0 1px #00b4d8" }}
              >
                <option value="general">General Inquiry</option>
                <option value="support">Technical Support</option>
                <option value="billing">Billing Question</option>
                <option value="partnership">Partnership Opportunity</option>
                <option value="feedback">Feedback</option>
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Message</FormLabel>
              <Textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Your message here..."
                size="lg"
                borderRadius="lg"
                rows={6}
                _hover={{ borderColor: "#00b4d8" }}
                _focus={{ borderColor: "#00b4d8", boxShadow: "0 0 0 1px #00b4d8" }}
              />
            </FormControl>

            <Button
              type="submit"
              bg="#00b4d8"
              color="white"
              size="lg"
              w="full"
              h="60px"
              fontSize="xl"
              isLoading={isSubmitting}
              loadingText="Sending..."
              _hover={{
                bg: "#0077b6",
                transform: "translateY(-2px)",
                boxShadow: "lg"
              }}
              _active={{
                bg: "#0077b6",
                transform: "translateY(0)",
              }}
            >
              Send Message
            </Button>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

export default ContactUs; 